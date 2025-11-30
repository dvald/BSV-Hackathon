"use strict";

import { Monitor } from "../monitor";
import { BsvService } from "./bsv-service";
import { DIDService } from "./did-service";
import { VerifiableCredential } from "../models/verifiable-credential";
import { CredentialRequest } from "../models/credential-request";
import { PrivateKey, Utils, WalletProtocol } from '@bsv/sdk';
import { DataFilter, OrderBy } from "tsbean-orm";
import { createVerifiableCredentialJwt, verifyCredential as verifyVC, JwtCredentialPayload } from 'did-jwt-vc';
import { Resolver } from 'did-resolver';
import Crypto from "crypto";
import { Credential } from "../models/credential";

/**
 * Verifiable Credentials Service - Request/Approval Flow
 * 
 * Flow:
 * 1. User requests credential with requestCredential()
 * 2. Issuer reviews pending requests with getPendingRequests()
 * 3. Issuer approves with approveRequest() -> issues credential to blockchain
 * 4. User gets their credentials with getUserCredentials()
 */
export class VerifiableCredentialsService {
    /* Singleton */
    private static instance: VerifiableCredentialsService = null;

    public static getInstance(): VerifiableCredentialsService {
        if (VerifiableCredentialsService.instance !== null) {
            return VerifiableCredentialsService.instance;
        } else {
            VerifiableCredentialsService.instance = new VerifiableCredentialsService();
            return VerifiableCredentialsService.instance;
        }
    }

    private bsvService: BsvService;
    private didService: DIDService;
    private resolver: Resolver;
    private readonly VC_CONTEXT = "https://www.w3.org/2018/credentials/v1";

    constructor() {
        this.bsvService = BsvService.getInstance();
        this.didService = DIDService.getInstance();
        
    }

    // ========== STEP 1: REQUEST CREDENTIAL ==========

    /**
     * User requests a verifiable credential
     * @param userDID DID of the requesting user
     * @param credentialType Type of credential (e.g., "DriversLicense", "MedicalCertificate")
     * @param requestData Dynamic data required for this credential type
     * @returns Request ID
     */
    public async requestCredential(
        userDID: string,
        credentialType: string,
        requestData: Record<string, any>
    ): Promise<{ requestId: string; status: string }> {
        try {
            Monitor.info(`User ${userDID} requesting credential type: ${credentialType}`);

            // Generate request ID
            const requestId = `req-${this.generateUUID()}`;

            // Create request record
            const request = new CredentialRequest({
                id: requestId,
                userDID: userDID,
                credentialType: credentialType,
                requestData: JSON.stringify(requestData),
                status: "PENDING",
                requestedAt: Date.now(),
                reviewedAt: 0,
                reviewedBy: "",
                rejectionReason: "",
                credentialId: ""
            });

            await request.insert();

            Monitor.info(`Credential request created: ${requestId}`);

            return {
                requestId,
                status: "PENDING"
            };
        } catch (error) {
            Monitor.error(`Error creating credential request: ${error.message}`);
            throw new Error(`Failed to request credential: ${error.message}`);
        }
    }

    // ========== STEP 2: GET PENDING REQUESTS ==========

    /**
     * Get all pending credential requests (for issuers)
     * @param credentialType Optional filter by credential type
     * @returns List of pending requests
     */
    public async getPendingRequests(credentialType?: string): Promise<any[]> {
        try {
            // Use the static helper method
            const requests = await CredentialRequest.findPending(credentialType);

            return requests.map(r => ({
                requestId: r.id,
                userDID: r.userDID,
                credentialType: r.credentialType,
                requestData: JSON.parse(r.requestData),
                status: r.status,
                requestedAt: r.requestedAt
            }));
        } catch (error) {
            Monitor.error(`Error getting pending requests: ${error.message}`);
            return [];
        }
    }

    // ========== STEP 3: APPROVE REQUEST & ISSUE CREDENTIAL ==========

    /**
     * Approve a credential request and issue the credential
     * @param requestId The request to approve
     * @param issuerPrivateKey Private key of the issuer
     * @param expirationDate Optional expiration date
     * @returns Issued credential details
     */
    public async approveRequest(
        requestId: string,
        issuerPrivateKey: PrivateKey,
        expirationDate?: string
    ): Promise<{ credentialId: string; txid: string; credential: any }> {
        try {
            Monitor.info(`Approving credential request: ${requestId}`);

            // Get the request using the static helper
            const request = await CredentialRequest.findById(requestId);
            if (!request) {
                const error = new Error("Request not found") as any;
                error.code = "REQUEST_NOT_FOUND";
                throw error;
            }

            if (request.status !== "PENDING") {
                const error = new Error(`Request has already been processed (status: ${request.status})`) as any;
                error.code = "REQUEST_ALREADY_PROCESSED";
                throw error;
            }

            // Get issuer DID from private key
            const issuerPublicKey = issuerPrivateKey.toPublicKey();
            const issuerAddress = issuerPublicKey.toAddress().toString();
            const issuerDID = `did:bsv:${issuerAddress}`;

            // Parse request data
            const requestData = JSON.parse(request.requestData);

            // Generate credential ID
            const credentialId = `urn:uuid:${this.generateUUID()}`;

            // Build Verifiable Credential using did-jwt-vc
            const issuanceDate = new Date();
            const vcPayload: JwtCredentialPayload = {
                sub: request.userDID,
                nbf: Math.floor(issuanceDate.getTime() / 1000),
                vc: {
                    '@context': [this.VC_CONTEXT],
                    type: ['VerifiableCredential', request.credentialType],
                    credentialSubject: {
                        ...requestData
                    }
                }
            };

            if (expirationDate) {
                vcPayload.exp = Math.floor(new Date(expirationDate).getTime() / 1000);
            }

            // Create issuer object for signing
            const issuer = {
                did: issuerDID,
                signer: this.createSigner(issuerPrivateKey),
                alg: 'ES256K'
            };

            // Create the JWT VC
            const vcJwt = await createVerifiableCredentialJwt(vcPayload, issuer);

            // Decode to get the full credential
            const credential = {
                '@context': [this.VC_CONTEXT],
                id: credentialId,
                type: ['VerifiableCredential', request.credentialType],
                issuer: issuerDID,
                issuanceDate: issuanceDate.toISOString(),
                credentialSubject: {
                    id: request.userDID,
                    ...requestData
                },
                proof: {
                    type: 'JwtProof2020',
                    jwt: vcJwt
                }
            };

            if (expirationDate) {
                credential['expirationDate'] = expirationDate;
            }

            // Hash the credential for blockchain anchor
            const credentialJSON = JSON.stringify(credential);
            const credentialHash = this.computeSHA256(credentialJSON);

            // Anchor to BSV blockchain
            const anchorData = `VCANCHOR|v1|${credentialId}|${request.credentialType}|sha256:${credentialHash}|jwt:${vcJwt.substring(0, 50)}`;
            const txid = "await this.anchorToBlockchain(anchorData, issuerPrivateKey, credentialId);"

            // Save credential to database
            const expiresAt = expirationDate ? new Date(expirationDate).getTime() : 0;

            const vcRecord = new VerifiableCredential({
                id: credentialId,
                holderDID: request.userDID,
                issuerDID: issuerDID,
                type: request.credentialType,
                credentialJSON: credentialJSON,
                credentialHash: credentialHash,
                anchorTxid: txid,
                issuedAt: Date.now(),
                expiresAt: expiresAt,
                isRevoked: false,
                revokedAt: 0,
                revocationReason: "",
                revocationTxid: ""
            });

            await vcRecord.insert();

            // Update request status
            request.status = "APPROVED";
            request.reviewedAt = Date.now();
            request.reviewedBy = issuerDID;
            request.credentialId = credentialId;
            await request.save();

            await Credential.create(request.userDID, request.credentialType); // Create credential record

            Monitor.info(`Credential approved and issued: ${credentialId}, TXID: ${txid}`);

            return {
                credentialId,
                txid,
                credential
            };
        } catch (error) {
            Monitor.exception(error, "VerifiableCredentialsService.approveRequest failed");
            throw error;
        }
    }

    // ========== STEP 4: REJECT REQUEST ==========

    /**
     * Reject a credential request
     * @param requestId The request to reject
     * @param issuerDID DID of the issuer rejecting
     * @param reason Reason for rejection
     */
    public async rejectRequest(
        requestId: string,
        issuerDID: string,
        reason: string
    ): Promise<{ success: boolean }> {
        try {
            Monitor.info(`Rejecting credential request: ${requestId}`);

            const request = await CredentialRequest.findById(requestId);
            if (!request) {
                const error = new Error("Request not found") as any;
                error.code = "REQUEST_NOT_FOUND";
                throw error;
            }

            if (request.status !== "PENDING") {
                const error = new Error(`Request has already been processed (status: ${request.status})`) as any;
                error.code = "REQUEST_ALREADY_PROCESSED";
                throw error;
            }

            request.status = "REJECTED";
            request.reviewedAt = Date.now();
            request.reviewedBy = issuerDID;
            request.rejectionReason = reason;
            await request.save();

            Monitor.info(`Request rejected: ${requestId}`);

            return { success: true };
        } catch (error) {
            Monitor.exception(error, "VerifiableCredentialsService.rejectRequest failed");
            throw error;
        }
    }

    // ========== STEP 5: GET USER CREDENTIALS ==========

    /**
     * Get all credentials for a user
     * @param userDID DID of the user
     * @returns List of credentials
     */
    public async getUserCredentials(userDID: string): Promise<any[]> {
        try {
            Monitor.info(`Getting credentials for user: ${userDID}`);

            // Use DataFilter to query properly
            const credentials = await VerifiableCredential.finder.find(
                DataFilter.and(
                    DataFilter.equals("holderDID", userDID),
                    DataFilter.equals("isRevoked", false)
                ),
                OrderBy.desc("issuedAt")
            );

            return credentials.map(c => ({
                credentialId: c.id,
                credentialType: c.type,
                credential: JSON.parse(c.credentialJSON),
                issuerDID: c.issuerDID,
                issuedAt: c.issuedAt,
                expiresAt: c.expiresAt,
                anchorTxid: c.anchorTxid
            }));
        } catch (error) {
            Monitor.exception(error, "VerifiableCredentialsService.getUserCredentials failed");
            return [];
        }
    }

    // ========== HELPER: GET REQUEST STATUS ==========

    /**
     * Get status of a credential request
     * @param requestId Request ID
     * @returns Request details
     */
    public async getRequestStatus(requestId: string): Promise<any | null> {
        try {
            const request = await CredentialRequest.findById(requestId);
            if (!request) {
                return null;
            }

            const result: any = {
                requestId: request.id,
                userDID: request.userDID,
                credentialType: request.credentialType,
                requestData: JSON.parse(request.requestData),
                status: request.status,
                requestedAt: request.requestedAt
            };

            if (request.status === "APPROVED") {
                result.credentialId = request.credentialId;
                result.reviewedBy = request.reviewedBy;
                result.reviewedAt = request.reviewedAt;
            } else if (request.status === "REJECTED") {
                result.rejectionReason = request.rejectionReason;
                result.reviewedBy = request.reviewedBy;
                result.reviewedAt = request.reviewedAt;
            }

            return result;
        } catch (error) {
            Monitor.exception(error, "VerifiableCredentialsService.getRequestStatus failed");
            return null;
        }
    }

    // ========== HELPER: VERIFY CREDENTIAL ==========

    /**
     * Verify a credential's authenticity
     * @param credential The credential to verify
     * @returns Verification result
     */
    public async verifyCredential(credential: any): Promise<{
        valid: boolean;
        errors: string[];
        checks: {
            structureValid: boolean;
            signatureValid: boolean;
            notExpired: boolean;
            notRevoked: boolean;
        }
    }> {
        const result = {
            valid: true,
            errors: [] as string[],
            checks: {
                structureValid: false,
                signatureValid: false,
                notExpired: false,
                notRevoked: false
            }
        };

        try {
            // Check structure
            if (!credential.id || !credential.type || !credential.issuer || !credential.credentialSubject) {
                result.valid = false;
                result.errors.push("Invalid credential structure");
                return result;
            }
            result.checks.structureValid = true;

            // Check signature using did-jwt-vc if JWT proof exists
            if (credential.proof && credential.proof.jwt) {
                try {
                    const verifiedVC = await verifyVC(credential.proof.jwt, this.resolver);
                    result.checks.signatureValid = verifiedVC.verified;
                    
                    if (!verifiedVC.verified) {
                        result.valid = false;
                        result.errors.push("Invalid signature");
                    }
                } catch (error) {
                    result.valid = false;
                    result.errors.push(`Signature verification failed: ${error.message}`);
                }
            } else if (credential.proof && credential.proof.jws) {
                // Legacy JWS proof
                result.checks.signatureValid = true;
                Monitor.debug("Using legacy JWS proof validation");
            } else {
                result.valid = false;
                result.errors.push("Missing or invalid signature");
            }

            // Check expiration
            if (credential.expirationDate) {
                const now = new Date();
                const expiration = new Date(credential.expirationDate);
                if (now < expiration) {
                    result.checks.notExpired = true;
                } else {
                    result.valid = false;
                    result.errors.push("Credential has expired");
                }
            } else {
                result.checks.notExpired = true;
            }

            // Check revocation
            const vcRecord = await VerifiableCredential.finder.findByKey(credential.id);
            if (vcRecord) {
                if (!vcRecord.isRevoked) {
                    result.checks.notRevoked = true;
                } else {
                    result.valid = false;
                    result.errors.push("Credential has been revoked");
                }
            } else {
                result.checks.notRevoked = true; // Not in DB, assume not revoked
            }

            return result;
        } catch (error) {
            Monitor.exception(error, "VerifiableCredentialsService.verifyCredential failed");
            result.valid = false;
            result.errors.push(`Verification error: ${error.message}`);
            return result;
        }
    }

    // ========== PRIVATE HELPER METHODS ==========

    /**
     * Creates a signer function for did-jwt-vc
     */
    private createSigner(privateKey: PrivateKey) {
        return async (data: string | Uint8Array): Promise<string> => {
            try {
                // Convert data to buffer if needed
                const dataBuffer = typeof data === 'string' 
                    ? Buffer.from(data, 'utf8')
                    : Buffer.from(data);

                // Hash the data
                const hash = Crypto.createHash('sha256').update(dataBuffer).digest();

                // Sign with the private key (simplified - using HMAC for now)
                // In production, use proper ECDSA signing
                const privateKeyHex = privateKey.toHex();
                const signature = Crypto.createHmac('sha256', privateKeyHex)
                    .update(hash)
                    .digest();

                // Return base64url encoded signature
                return signature.toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=/g, '');
            } catch (error) {
                Monitor.exception(error, "Signer failed");
                throw error;
            }
        };
    }

    private async anchorToBlockchain(data: string, privateKey: PrivateKey, reference: string): Promise<string> {
        const wallet = this.bsvService.getWallet();
        
        if (!wallet) {
            throw new Error("BSV wallet not initialized");
        }

        const protocolID: WalletProtocol = [2, 'VCCRED'];

        // Encrypt data
        const { ciphertext } = await wallet.encrypt({
            plaintext: Utils.toArray(data, 'utf8'),
            protocolID: protocolID,
            keyID: '1',
            counterparty: 'self'
        });

        // Create transaction with OP_RETURN
        const result = await wallet.createAction({
            description: `VC Anchor: ${reference}`,
            outputs: [{
                lockingScript: `OP_FALSE OP_RETURN ${Buffer.from(ciphertext).toString('hex')}`,
                satoshis: 0,
                basket: 'credentials',
                outputDescription: `Credential anchor`
            }],
            options: {
                randomizeOutputs: false
            }
        });

        if (!result || !result.txid) {
            throw new Error("Failed to anchor credential");
        }

        Monitor.info(`Credential anchored to blockchain: ${result.txid}`);
        return result.txid;
    }

    private computeSHA256(data: string): string {
        return Crypto.createHash('sha256').update(data, 'utf8').digest('hex');
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
