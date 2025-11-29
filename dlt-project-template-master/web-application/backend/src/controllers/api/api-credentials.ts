// Verifiable Credentials Controller - Request/Approval Flow

"use strict";

import Express from "express";
import { BAD_REQUEST, ensureObjectBody, INTERNAL_SERVER_ERROR, noCache, sendApiError, sendApiResult } from "../../utils/http-utils";
import { Controller } from "../controller";
import { VerifiableCredentialsService } from "../../services/verifiable-credentials-service";
import { Monitor } from "../../monitor";
import { PrivateKey } from "@bsv/sdk";

/**
 * Verifiable Credentials API Controller
 * Request -> Approval -> Issuance Flow
 * @group credentials - Verifiable Credentials API
 */
export class CredentialsController extends Controller {
    private vcService: VerifiableCredentialsService;

    constructor() {
        super();
        this.vcService = VerifiableCredentialsService.getInstance();
    }

    public registerAPI(prefix: string, application: Express.Express): void {
        // Step 1: User requests a credential
        application.post(prefix + "/credentials/request", ensureObjectBody(this.requestCredential.bind(this)));

        // Step 2: Issuer gets pending requests
        application.get(prefix + "/credentials/requests/pending", noCache(this.getPendingRequests.bind(this)));

        // Step 3a: Issuer approves request
        application.post(prefix + "/credentials/approve", ensureObjectBody(this.approveRequest.bind(this)));

        // Step 3b: Issuer rejects request
        application.post(prefix + "/credentials/reject", ensureObjectBody(this.rejectRequest.bind(this)));

        // Step 4: User gets their credentials
        application.get(prefix + "/credentials/my/:userDID", noCache(this.getUserCredentials.bind(this)));

        // Helper: Get request status
        application.get(prefix + "/credentials/request/:requestId", noCache(this.getRequestStatus.bind(this)));

        // Helper: Verify credential
        application.post(prefix + "/credentials/verify", ensureObjectBody(this.verifyCredential.bind(this)));
    }

    /**
     * @typedef RequestCredentialRequest
     * @property {string} userDID.required - User's DID identifier
     * @property {string} credentialType.required - Type of credential (e.g., "DriversLicense", "MedicalCertificate")
     * @property {object} requestData.required - Data for this credential type (dynamic)
     */

    /**
     * @typedef RequestCredentialResponse
     * @property {string} requestId.required - The request ID
     * @property {string} status.required - Status (PENDING)
     */

    /**
     * Request a Verifiable Credential
     * User submits a request for a specific type of credential
     * @route POST /credentials/request
     * @group credentials
     * @param {RequestCredentialRequest.model} request.body.required - Request parameters
     * @returns {RequestCredentialResponse.model} 200 - Request created successfully
     * @returns {Error} 400 - Invalid request parameters
     * @returns {Error} 500 - Internal server error
     */
    public async requestCredential(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const body = request.body;

            // Validate required fields
            if (!body.userDID) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_USER_DID", "User DID is required");
            }

            if (!body.credentialType) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_CREDENTIAL_TYPE", "Credential type is required");
            }

            if (!body.requestData || typeof body.requestData !== 'object') {
                return sendApiError(request, response, BAD_REQUEST, "INVALID_REQUEST_DATA", "Request data must be an object");
            }

            // Validate DID format
            if (!body.userDID.startsWith('did:bsv:')) {
                return sendApiError(request, response, BAD_REQUEST, "INVALID_DID_FORMAT", "DID must start with 'did:bsv:'");
            }

            // Create credential request
            const result = await this.vcService.requestCredential(
                body.userDID,
                body.credentialType,
                body.requestData
            );

            Monitor.info(`Credential request created: ${result.requestId} for ${body.userDID}`);

            return sendApiResult(request, response, {
                requestId: result.requestId,
                status: result.status
            });
        } catch (error) {
            Monitor.error(`Error creating credential request: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "REQUEST_FAILED", error.message);
        }
    }

    /**
     * @typedef GetPendingRequestsResponse
     * @property {Array.<object>} requests.required - Array of pending requests
     * @property {number} count.required - Total count
     */

    /**
     * Get Pending Credential Requests
     * For issuers to review pending requests
     * @route GET /credentials/requests/pending
     * @group credentials
     * @param {string} credentialType.query - Optional filter by credential type
     * @returns {GetPendingRequestsResponse.model} 200 - Pending requests
     * @returns {Error} 500 - Internal server error
     */
    public async getPendingRequests(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const credentialType = request.query.credentialType as string;

            const requests = await this.vcService.getPendingRequests(credentialType);

            Monitor.info(`Retrieved ${requests.length} pending credential requests`);

            return sendApiResult(request, response, {
                requests,
                count: requests.length
            });
        } catch (error) {
            Monitor.error(`Error getting pending requests: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "GET_REQUESTS_FAILED", error.message);
        }
    }

    /**
     * @typedef ApproveRequestRequest
     * @property {string} requestId.required - The request ID to approve
     * @property {string} issuerPrivateKey.required - Issuer's private key in hex format
     * @property {string} expirationDate - Optional expiration date (ISO 8601)
     */

    /**
     * @typedef ApproveRequestResponse
     * @property {string} credentialId.required - The issued credential ID
     * @property {string} txid.required - Blockchain anchor transaction ID
     * @property {object} credential.required - The complete credential
     */

    /**
     * Approve Credential Request
     * Issuer approves a request and issues the credential to blockchain
     * @route POST /credentials/approve
     * @group credentials
     * @param {ApproveRequestRequest.model} request.body.required - Approval parameters
     * @returns {ApproveRequestResponse.model} 200 - Request approved and credential issued
     * @returns {Error} 400 - Invalid request parameters
     * @returns {Error} 500 - Internal server error
     */
    public async approveRequest(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const body = request.body;

            // Validate required fields
            if (!body.requestId) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_REQUEST_ID", "Request ID is required");
            }

            if (!body.issuerPrivateKey) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_ISSUER_KEY", "Issuer private key is required");
            }

            // Parse issuer private key
            let issuerPrivateKey: PrivateKey;
            try {
                issuerPrivateKey = PrivateKey.fromHex(body.issuerPrivateKey);
            } catch (error) {
                return sendApiError(request, response, BAD_REQUEST, "INVALID_PRIVATE_KEY", "Invalid private key format");
            }

            // Approve and issue credential
            const result = await this.vcService.approveRequest(
                body.requestId,
                issuerPrivateKey,
                body.expirationDate
            );

            Monitor.info(`Request approved: ${body.requestId}, Credential: ${result.credentialId}`);

            return sendApiResult(request, response, {
                credentialId: result.credentialId,
                txid: result.txid,
                credential: result.credential
            });
        } catch (error) {
            Monitor.error(`Error approving request: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "APPROVAL_FAILED", error.message);
        }
    }

    /**
     * @typedef RejectRequestRequest
     * @property {string} requestId.required - The request ID to reject
     * @property {string} issuerDID.required - Issuer's DID
     * @property {string} reason.required - Reason for rejection
     */

    /**
     * @typedef RejectRequestResponse
     * @property {boolean} success.required - Whether rejection was successful
     */

    /**
     * Reject Credential Request
     * Issuer rejects a credential request
     * @route POST /credentials/reject
     * @group credentials
     * @param {RejectRequestRequest.model} request.body.required - Rejection parameters
     * @returns {RejectRequestResponse.model} 200 - Request rejected
     * @returns {Error} 400 - Invalid request parameters
     * @returns {Error} 500 - Internal server error
     */
    public async rejectRequest(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const body = request.body;

            // Validate required fields
            if (!body.requestId) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_REQUEST_ID", "Request ID is required");
            }

            if (!body.issuerDID) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_ISSUER_DID", "Issuer DID is required");
            }

            if (!body.reason) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_REASON", "Rejection reason is required");
            }

            // Reject request
            const result = await this.vcService.rejectRequest(
                body.requestId,
                body.issuerDID,
                body.reason
            );

            Monitor.info(`Request rejected: ${body.requestId}`);

            return sendApiResult(request, response, {
                success: result.success
            });
        } catch (error) {
            Monitor.error(`Error rejecting request: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "REJECTION_FAILED", error.message);
        }
    }

    /**
     * @typedef GetUserCredentialsResponse
     * @property {Array.<object>} credentials.required - Array of credentials
     * @property {number} count.required - Total count
     */

    /**
     * Get User's Credentials
     * Retrieve all credentials for a specific user
     * @route GET /credentials/my/{userDID}
     * @group credentials
     * @param {string} userDID.path.required - User's DID
     * @returns {GetUserCredentialsResponse.model} 200 - User's credentials
     * @returns {Error} 400 - Invalid DID
     * @returns {Error} 500 - Internal server error
     */
    public async getUserCredentials(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const userDID = request.params.userDID;

            if (!userDID) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_USER_DID", "User DID is required");
            }

            if (!userDID.startsWith('did:bsv:')) {
                return sendApiError(request, response, BAD_REQUEST, "INVALID_DID_FORMAT", "DID must start with 'did:bsv:'");
            }

            const credentials = await this.vcService.getUserCredentials(userDID);

            Monitor.info(`Retrieved ${credentials.length} credentials for ${userDID}`);

            return sendApiResult(request, response, {
                credentials,
                count: credentials.length
            });
        } catch (error) {
            Monitor.error(`Error getting user credentials: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "GET_CREDENTIALS_FAILED", error.message);
        }
    }

    /**
     * @typedef GetRequestStatusResponse
     * @property {string} requestId.required - Request ID
     * @property {string} userDID.required - User's DID
     * @property {string} credentialType.required - Credential type
     * @property {object} requestData.required - Request data
     * @property {string} status.required - Status (PENDING, APPROVED, REJECTED)
     * @property {number} requestedAt.required - Timestamp
     * @property {string} credentialId - Credential ID (if approved)
     * @property {string} rejectionReason - Rejection reason (if rejected)
     */

    /**
     * Get Request Status
     * Check the status of a credential request
     * @route GET /credentials/request/{requestId}
     * @group credentials
     * @param {string} requestId.path.required - Request ID
     * @returns {GetRequestStatusResponse.model} 200 - Request status
     * @returns {Error} 404 - Request not found
     * @returns {Error} 500 - Internal server error
     */
    public async getRequestStatus(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const requestId = request.params.requestId;

            if (!requestId) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_REQUEST_ID", "Request ID is required");
            }

            const requestStatus = await this.vcService.getRequestStatus(requestId);

            if (!requestStatus) {
                return sendApiError(request, response, 404, "REQUEST_NOT_FOUND", "Request not found");
            }

            Monitor.info(`Retrieved status for request: ${requestId}`);

            return sendApiResult(request, response, requestStatus);
        } catch (error) {
            Monitor.error(`Error getting request status: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "GET_STATUS_FAILED", error.message);
        }
    }

    /**
     * @typedef VerifyCredentialRequest
     * @property {object} credential.required - The credential to verify
     */

    /**
     * @typedef VerifyCredentialResponse
     * @property {boolean} valid.required - Whether credential is valid
     * @property {Array.<string>} errors - Validation errors
     * @property {object} checks.required - Individual checks
     */

    /**
     * Verify Credential
     * Verify the authenticity and validity of a credential
     * @route POST /credentials/verify
     * @group credentials
     * @param {VerifyCredentialRequest.model} request.body.required - Credential to verify
     * @returns {VerifyCredentialResponse.model} 200 - Verification result
     * @returns {Error} 400 - Invalid credential
     * @returns {Error} 500 - Internal server error
     */
    public async verifyCredential(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const body = request.body;

            if (!body.credential || typeof body.credential !== 'object') {
                return sendApiError(request, response, BAD_REQUEST, "INVALID_CREDENTIAL", "Credential must be an object");
            }

            const result = await this.vcService.verifyCredential(body.credential);

            Monitor.info(`Credential verified: ${body.credential.id}, Valid: ${result.valid}`);

            return sendApiResult(request, response, result);
        } catch (error) {
            Monitor.error(`Error verifying credential: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "VERIFICATION_FAILED", error.message);
        }
    }
}
