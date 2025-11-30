// Verifiable Credentials Controller - Request/Approval Flow

"use strict";

import Express from "express";
import { BAD_REQUEST, ensureObjectBody, INTERNAL_SERVER_ERROR, noCache, sendApiError, sendApiResult, sendUnauthorized } from "../../utils/http-utils";
import { Controller } from "../controller";
import { VerifiableCredentialsService } from "../../services/verifiable-credentials-service";
import { Monitor } from "../../monitor";
import { PrivateKey } from "@bsv/sdk";
import { UsersService } from "../../services/users-service";
import { CredentialRequest } from "../../models/credential-request";

/**
 * Verifiable Credentials API Controller
 * Request -> Approval -> Issuance Flow
 * @group credentials - Verifiable Credentials API
 */
export class CredentialsController extends Controller {


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
     * @property {string} credentialId.required - Credential ID
     * @property {string} serviceId.required - Service ID
     * @property {string} documentId.required - Document ID
     */

    /**
     * @typedef RequestCredentialResponse
     * @property {string} requestId.required - The request ID
     * @property {string} status.required - Status (PENDING)
     */

    /**
     * Request a Verifiable Credential
     * User submits a request for a specific type of credential
     * Binding: RequestCredential
     * @route POST /credentials/request
     * @group credentials
     * @param {RequestCredentialRequest.model} request.body.required - Request parameters
     * @returns {RequestCredentialResponse.model} 200 - Request created successfully
     * @returns {Error} 400 - Invalid request parameters
     * @returns {Error} 500 - Internal server error
     */
    public async requestCredential(request: Express.Request, response: Express.Response): Promise<void> {
        console.log("requestCredential");
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser()) {
            sendUnauthorized(request, response);
            return;
        }
        try {
            const body = request.body;

            // Validate required fields
            if (!auth.user.did) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_USER_DID", "User DID is required");
            }

            if (!body.serviceId) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_SERVICE_ID", "Service ID is required");
            }

            if (!body.documentId) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_DOCUMENT_ID", "Document ID is required");
            }

            if (!body.credentialId) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_CREDENTIAL_ID", "Credential ID is required");
            }

            // Validate DID format
            if (!auth.user.did.startsWith('did:bsv:')) {
                return sendApiError(request, response, BAD_REQUEST, "INVALID_DID_FORMAT", "DID must start with 'did:bsv:'");
            }

            // Use credentialId as credentialType (the frontend sends the credential type as credentialId)
            const credentialType = body.credentialId;
            const requestData = body.requestData || {};

            // Create credential request using the service
            const result = await VerifiableCredentialsService.getInstance().requestCredential(
                auth.user.did,
                credentialType,
                requestData
            );

            // Update the created request with additional fields (credentialId, documentId, serviceId)
            const credentialRequest = await CredentialRequest.findById(result.requestId);
            if (credentialRequest) {
                credentialRequest.credentialId = body.credentialId;
                credentialRequest.documentId = body.documentId;
                credentialRequest.serviceId = body.serviceId;
                await credentialRequest.save();
            } else {
                // If for some reason the request wasn't found, create a new one with all fields
                const newRequest = new CredentialRequest({
                    id: result.requestId,
                    userDID: auth.user.did,
                    credentialType: credentialType,
                    requestData: JSON.stringify(requestData),
                    status: result.status,
                    requestedAt: Date.now(),
                    reviewedAt: 0,
                    reviewedBy: "",
                    rejectionReason: "",
                    credentialId: body.credentialId,
                    documentId: body.documentId,
                    serviceId: body.serviceId
                });
                await newRequest.insert();
            }

            Monitor.info(`Credential request created: ${result.requestId} for ${auth.user.did} with service ${body.serviceId}`);

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
     * @property {Array.<CredentialRequest>} requests.required - Array of pending requests
     * @property {number} count.required - Total count
     */

    /**
     * Get Pending Credential Requests
     * Binding: GetPendingRequests
     * @route GET /credentials/requests/pending
     * @group credentials
     * @returns {GetPendingRequestsResponse.model} 200 - Pending requests
     * @returns {Error} 500 - Internal server error
     */
    public async getPendingRequests(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const requests = await CredentialRequest.findPending();

            return sendApiResult(request, response, {
                requests: requests.map(r => r.toObject()),
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
     * @property {string} credentialRequestId.required - The issued credential ID
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
            const result = await VerifiableCredentialsService.getInstance().approveRequest(
                body.requestId,
                issuerPrivateKey,
                body.expirationDate
            );

            const credentialRequest = await CredentialRequest.findById(body.requestId);
            if (!credentialRequest) {
                return sendApiError(request, response, BAD_REQUEST, "REQUEST_NOT_FOUND", "Request not found");
            }
            credentialRequest.status = "APPROVED";
            credentialRequest.reviewedAt = Date.now();
            credentialRequest.credentialId = result.credentialId;
            await credentialRequest.save();

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
            const result = await VerifiableCredentialsService.getInstance().rejectRequest(
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

            const credentials = await VerifiableCredentialsService.getInstance().getUserCredentials(userDID);

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

            const requestStatus = await VerifiableCredentialsService.getInstance().getRequestStatus(requestId);

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

            const result = await VerifiableCredentialsService.getInstance().verifyCredential(body.credential);

            Monitor.info(`Credential verified: ${body.credential.id}, Valid: ${result.valid}`);

            return sendApiResult(request, response, result);
        } catch (error) {
            Monitor.error(`Error verifying credential: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "VERIFICATION_FAILED", error.message);
        }
    }
}
