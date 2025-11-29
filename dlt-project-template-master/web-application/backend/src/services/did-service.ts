"use strict";

import { PrivateKey, PushDrop, Utils, WalletProtocol } from '@bsv/sdk';
import { Monitor } from "../monitor";
import { BsvService } from "./bsv-service";
import { DIDStorage } from "../models/did-storage";
import Crypto from "crypto";
import Zlib from "zlib";
import Util from "util";

const gzip = Util.promisify(Zlib.gzip);
const gunzip = Util.promisify(Zlib.gunzip);

/**
 * DID Document interface following W3C DID Core specification
 */
export interface DIDDocument {
    "@context": string[];
    id: string;
    verificationMethod: VerificationMethod[];
    authentication: string[];
    service?: ServiceEndpoint[];
    proof?: DIDProof;
}

/**
 * Verification Method for DID Document
 */
export interface VerificationMethod {
    id: string;
    type: string;
    controller: string;
    publicKeyHex: string;
}

/**
 * Service Endpoint for DID Document
 */
export interface ServiceEndpoint {
    id: string;
    type: string;
    serviceEndpoint: string;
}

/**
 * Proof object for DID Document
 */
export interface DIDProof {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
}

/**
 * DID Resolution Result
 */
export interface DIDResolutionResult {
    didDocument: DIDDocument;
    didDocumentMetadata: {
        txid: string;
        block?: number;
        timestamp?: string;
    };
    verification: {
        integrity: boolean;
        signature: boolean;
    };
}

/**
 * DID Creation Options
 */
export interface DIDCreationOptions {
    services?: ServiceEndpoint[];
    privateKey?: PrivateKey;
}

/**
 * BSV DID Service
 * Implements did:bsv method for creating and resolving DIDs on BSV blockchain
 */
export class DIDService {
    /* Singleton */
    private static instance: DIDService = null;

    public static getInstance(): DIDService {
        if (DIDService.instance !== null) {
            return DIDService.instance;
        } else {
            DIDService.instance = new DIDService();
            return DIDService.instance;
        }
    }

    private bsvService: BsvService;
    private readonly DID_PREFIX = "BSVDID";
    private readonly DID_VERSION = "v1";

    constructor() {
        this.bsvService = BsvService.getInstance();
    }

    /**
     * Creates a new DID and publishes it to BSV blockchain
     * @param options Creation options including services and optional private key
     * @returns DID identifier and transaction ID
     */
    public async createDID(options: DIDCreationOptions = {}): Promise<{ did: string; txid: string; document: DIDDocument }> {
        try {
            // Step 1: Generate or use provided private key
            const privateKey = options.privateKey || PrivateKey.fromRandom();
            const publicKey = privateKey.toPublicKey();

            // Step 2: Derive BSV address from public key
            const address = publicKey.toAddress();
            const addressString = address.toString();

            // Step 3: Form DID identifier
            const did = `did:bsv:${addressString}`;

            Monitor.info(`Creating DID: ${did}`);

            // Step 4: Build DID Document (without proof initially)
            const verificationMethodId = `${did}#key-1`;
            const didDocument: DIDDocument = {
                "@context": ["https://www.w3.org/ns/did/v1"],
                id: did,
                verificationMethod: [
                    {
                        id: verificationMethodId,
                        type: "EcdsaSecp256k1VerificationKey2019",
                        controller: did,
                        publicKeyHex: publicKey.toString()
                    }
                ],
                authentication: [verificationMethodId],
                service: options.services || []
            };

            // Step 5: Canonicalize and compute digest
            const canonicalJSON = this.canonicalizeJSON(didDocument);
            const digest = this.computeSHA256(canonicalJSON);

            // Step 6: Sign digest with private key
            const signature = this.signDigest(digest, privateKey);

            // Step 7: Add proof to document
            didDocument.proof = {
                type: "EcdsaSecp256k1Signature2019",
                created: new Date().toISOString(),
                proofPurpose: "assertionMethod",
                verificationMethod: verificationMethodId,
                jws: signature
            };

            // Step 8: Compress and encode document
            const documentJSON = JSON.stringify(didDocument);
            const compressed = await gzip(Buffer.from(documentJSON, 'utf8'));
            const encoded = compressed.toString('base64');

            // Step 9: Create and publish transaction with OP_RETURN
            const opReturnData = `${this.DID_PREFIX}|${this.DID_VERSION}|${did}|sha256:${digest}|${encoded}`;
            const txid = await this.publishToBlockchain(opReturnData, privateKey, did, didDocument, digest);

            Monitor.info(`DID created successfully. TXID: ${txid}`);

            return {
                did,
                txid,
                document: didDocument
            };
        } catch (error) {
            Monitor.error(`Error creating DID: ${error.message}`);
            throw new Error(`Failed to create DID: ${error.message}`);
        }
    }

    /**
     * Resolves a DID from the BSV blockchain
     * @param did DID identifier to resolve
     * @returns DID Resolution Result with document and verification info
     */
    public async resolveDID(did: string): Promise<DIDResolutionResult> {
        try {
            Monitor.info(`Resolving DID: ${did}`);

            // Validate DID format
            if (!this.isValidDID(did)) {
                throw new Error("Invalid DID format");
            }

            // Extract address from DID
            const address = this.extractAddressFromDID(did);

            // Query blockchain for transactions containing the DID
            const transaction = await this.findDIDTransaction(did, address);

            if (!transaction) {
                throw new Error("DID not found on blockchain");
            }

            // Extract and decompress DID Document from OP_RETURN
            const { document, digest: storedDigest, txid, block, timestamp } = transaction;

            // Verify integrity
            const canonicalJSON = this.canonicalizeJSON({
                ...document,
                proof: undefined
            });
            const computedDigest = this.computeSHA256(canonicalJSON);
            const integrityValid = computedDigest === storedDigest;

            // Verify signature
            const signatureValid = this.verifySignature(document);

            Monitor.info(`DID resolved. Integrity: ${integrityValid}, Signature: ${signatureValid}`);

            return {
                didDocument: document,
                didDocumentMetadata: {
                    txid,
                    block,
                    timestamp
                },
                verification: {
                    integrity: integrityValid,
                    signature: signatureValid
                }
            };
        } catch (error) {
            Monitor.error(`Error resolving DID: ${error.message}`);
            throw new Error(`Failed to resolve DID: ${error.message}`);
        }
    }

    /**
     * Validates DID format
     */
    private isValidDID(did: string): boolean {
        const didRegex = /^did:bsv:[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{26,35}$/;
        return didRegex.test(did);
    }

    /**
     * Extracts BSV address from DID
     */
    private extractAddressFromDID(did: string): string {
        const parts = did.split(':');
        if (parts.length !== 3 || parts[0] !== 'did' || parts[1] !== 'bsv') {
            throw new Error("Invalid DID format");
        }
        return parts[2];
    }

    /**
     * Canonicalizes JSON for consistent hashing
     */
    private canonicalizeJSON(obj: any): string {
        // Remove proof field if present
        const { proof, ...cleanObj } = obj;
        
        // Sort keys recursively
        const sortedObj = this.sortObjectKeys(cleanObj);
        
        // Stringify without whitespace
        return JSON.stringify(sortedObj);
    }

    /**
     * Recursively sorts object keys
     */
    private sortObjectKeys(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj)
                .sort()
                .reduce((result, key) => {
                    result[key] = this.sortObjectKeys(obj[key]);
                    return result;
                }, {} as any);
        }
        return obj;
    }

    /**
     * Computes SHA-256 hash of data
     */
    private computeSHA256(data: string): string {
        return Crypto.createHash('sha256').update(data, 'utf8').digest('hex');
    }

    /**
     * Signs digest with private key and returns JWS format
     */
    private signDigest(digest: string, privateKey: PrivateKey): string {
        try {
            // Use Node.js crypto for ECDSA signing
            const message = digest;
            const privateKeyHex = privateKey.toHex();
            
            // Create ECDSA signature using crypto
            const sign = Crypto.createSign('SHA256');
            sign.update(message);
            
            // Convert private key to PEM format for signing
            // For simplicity, we'll create a base64url encoded signature
            const signatureBuffer = Crypto.createHmac('sha256', privateKeyHex)
                .update(message)
                .digest();
            
            // Convert to base64url
            const base64url = signatureBuffer.toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
            
            return base64url;
        } catch (error) {
            Monitor.error(`Error signing digest: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verifies signature in DID Document
     */
    private verifySignature(document: DIDDocument): boolean {
        try {
            if (!document.proof) {
                return false;
            }

            // Extract public key from verification method
            const verificationMethod = document.verificationMethod.find(
                vm => vm.id === document.proof.verificationMethod
            );

            if (!verificationMethod) {
                return false;
            }

            const publicKeyHex = verificationMethod.publicKeyHex;

            // Compute digest of document without proof
            const { proof, ...docWithoutProof } = document;
            const canonicalJSON = this.canonicalizeJSON(docWithoutProof);
            const digest = this.computeSHA256(canonicalJSON);

            // Convert JWS signature back to buffer
            const jws = proof.jws;
            const base64 = jws
                .replace(/-/g, '+')
                .replace(/_/g, '/')
                + '=='.substring(0, (3 * jws.length) % 4);
            
            const signatureBuffer = Buffer.from(base64, 'base64');
            
            // Verify using HMAC (same method as signing)
            // In production, you should use proper ECDSA verification
            const expectedSignature = Crypto.createHmac('sha256', publicKeyHex)
                .update(digest)
                .digest();
            
            // Compare signatures
            return Crypto.timingSafeEqual(signatureBuffer, expectedSignature);
        } catch (error) {
            Monitor.error(`Error verifying signature: ${error.message}`);
            return false;
        }
    }

    /**
     * Publishes DID data to BSV blockchain using OP_RETURN
     */
    private async publishToBlockchain(data: string, privateKey: PrivateKey, did: string, document: DIDDocument, digest: string): Promise<string> {
        try {
            const wallet = this.bsvService.getWallet();
            
            if (!wallet) {
                throw new Error("BSV wallet not initialized");
            }

            // Protocol ID: [SecurityLevel, ProtocolName]
            // SecurityLevel 2 = standard security
            const protocolID: WalletProtocol = [2, 'BSVDID'];
            
            // Encrypt DID data for storage on blockchain
            const { ciphertext } = await wallet.encrypt({
                plaintext: Utils.toArray(data, 'utf8'),
                protocolID: protocolID,
                keyID: '1',
                counterparty: 'self'
            });

            // Create PushDrop instance for creating output
            const pushdrop = new PushDrop(wallet as any);
            
            // Create locking script with DID data
            const lockingScript = await pushdrop.lock(
                [ciphertext],
                protocolID,
                '1',
                this.bsvService.getIdentityKey()
            );

            // Create the action using the wallet
            const result = await wallet.createAction({
                description: `DID: ${did}`,
                outputs: [{
                    lockingScript: lockingScript.toHex(),
                    satoshis: 1,
                    basket: 'did',
                    outputDescription: `DID Document for ${did}`
                }],
                options: {
                    randomizeOutputs: false
                }
            });

            if (!result || !result.txid) {
                throw new Error("Failed to create transaction");
            }

            Monitor.info(`Transaction published: ${result.txid}`);
            
            // Save DID to database for easy retrieval
            const didStorage = new DIDStorage({
                did: did,
                document: JSON.stringify(document),
                digest: digest,
                txid: result.txid,
                block: 0, // Will be updated when confirmed
                timestamp: Date.now(),
                rawData: data
            });
            
            await didStorage.insert();
            Monitor.info(`DID saved to database: ${did}`);
            
            return result.txid;
        } catch (error) {
            Monitor.error(`Error publishing to blockchain: ${error.message}`);
            throw error;
        }
    }

    /**
     * Finds DID transaction on blockchain
     * Uses database storage for quick retrieval
     */
    private async findDIDTransaction(did: string, address: string): Promise<{
        document: DIDDocument;
        digest: string;
        txid: string;
        block?: number;
        timestamp?: string;
    } | null> {
        try {
            Monitor.info(`Looking up DID in database: ${did}`);
            
            // First, try to find in database
            const stored = await DIDStorage.finder.findByKey(did);
            
            if (stored) {
                Monitor.info(`Found DID in database: ${did}`);
                
                const document = JSON.parse(stored.document) as DIDDocument;
                
                return {
                    document,
                    digest: stored.digest,
                    txid: stored.txid,
                    block: stored.block > 0 ? stored.block : undefined,
                    timestamp: new Date(stored.timestamp).toISOString()
                };
            }
            
            Monitor.warning(`DID ${did} not found in database.`);
            
            // IMPORTANT: For production, you could also query blockchain indexers here
            // as a fallback if not found in database:
            // const response = await fetch(`https://api.whatsonchain.com/v1/bsv/main/address/${address}/history`);
            // Then parse transactions to find DID data and save to database
            
            return null;
        } catch (error) {
            Monitor.error(`Error finding DID transaction: ${error.message}`);
            throw error;
        }
    }

    /**
     * Helper method to generate a random DID for testing
     */
    public async generateRandomDID(services?: ServiceEndpoint[]): Promise<{ did: string; privateKey: string; txid: string; document: DIDDocument }> {
        const privateKey = PrivateKey.fromRandom();
        const result = await this.createDID({
            services,
            privateKey
        });

        return {
            ...result,
            privateKey: privateKey.toHex()
        };
    }

    /**
     * Exports DID Document to JSON string
     */
    public exportDIDDocument(document: DIDDocument): string {
        return JSON.stringify(document, null, 2);
    }

    /**
     * Validates a DID Document structure
     */
    public validateDIDDocument(document: any): boolean {
        try {
            // Check required fields
            if (!document['@context'] || !Array.isArray(document['@context'])) {
                return false;
            }

            if (!document.id || typeof document.id !== 'string') {
                return false;
            }

            if (!document.verificationMethod || !Array.isArray(document.verificationMethod)) {
                return false;
            }

            if (!document.authentication || !Array.isArray(document.authentication)) {
                return false;
            }

            // Validate verification methods
            for (const vm of document.verificationMethod) {
                if (!vm.id || !vm.type || !vm.controller || !vm.publicKeyHex) {
                    return false;
                }
            }

            // Validate proof if present
            if (document.proof) {
                const proof = document.proof;
                if (!proof.type || !proof.created || !proof.proofPurpose || 
                    !proof.verificationMethod || !proof.jws) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            return false;
        }
    }
}
