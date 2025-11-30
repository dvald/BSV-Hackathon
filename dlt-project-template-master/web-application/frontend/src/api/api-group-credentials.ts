// API bindings: credentials (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonErrorHandler } from "@asanrom/request-browser";
import { getApiUrl } from "./utils";
import { RequestCredentialResponse, RequestCredentialRequest, GetPendingRequestsResponse, ApproveRequestResponse, ApproveRequestRequest, RejectRequestResponse, RejectRequestRequest, GetUserCredentialsResponse, GetRequestStatusResponse, VerifyCredentialResponse, VerifyCredentialRequest } from "./definitions";

export class ApiCredentials {
    /**
     * Method: POST
     * Path: /credentials/request
     * Request a Verifiable Credential
     * User submits a request for a specific type of credential
     * @param body Body parameters
     * @returns The request parameters
     */
    public static RequestCredential(body: RequestCredentialRequest): RequestParams<RequestCredentialResponse, RequestCredentialErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/credentials/request`),
            json: body,
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(400, "*", handler.badRequest)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /credentials/requests/pending
     * Get Pending Credential Requests
     * @returns The request parameters
     */
    public static GetPendingRequests(): RequestParams<GetPendingRequestsResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/credentials/requests/pending`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: POST
     * Path: /credentials/approve
     * Approve Credential Request
     * Issuer approves a request and issues the credential to blockchain
     * @param body Body parameters
     * @returns The request parameters
     */
    public static PostCredentialsApprove(body: ApproveRequestRequest): RequestParams<ApproveRequestResponse, PostCredentialsApproveErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/credentials/approve`),
            json: body,
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(400, "*", handler.badRequest)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: POST
     * Path: /credentials/reject
     * Reject Credential Request
     * Issuer rejects a credential request
     * @param body Body parameters
     * @returns The request parameters
     */
    public static PostCredentialsReject(body: RejectRequestRequest): RequestParams<RejectRequestResponse, PostCredentialsRejectErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/credentials/reject`),
            json: body,
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(400, "*", handler.badRequest)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /credentials/my/{userDID}
     * Get User's Credentials
     * Retrieve all credentials for a specific user
     * @param userDID User's DID
     * @returns The request parameters
     */
    public static GetCredentialsMyUserdid(userDID: string): RequestParams<GetUserCredentialsResponse, GetCredentialsMyUserdidErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/credentials/my/${encodeURIComponent(userDID)}`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(400, "*", handler.badRequest)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /credentials/request/{requestId}
     * Get Request Status
     * Check the status of a credential request
     * @param requestId Request ID
     * @returns The request parameters
     */
    public static GetCredentialsRequestRequestid(requestId: string): RequestParams<GetRequestStatusResponse, GetCredentialsRequestRequestidErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/credentials/request/${encodeURIComponent(requestId)}`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(404, "*", handler.notFound)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: POST
     * Path: /credentials/verify
     * Verify Credential
     * Verify the authenticity and validity of a credential
     * @param body Body parameters
     * @returns The request parameters
     */
    public static PostCredentialsVerify(body: VerifyCredentialRequest): RequestParams<VerifyCredentialResponse, PostCredentialsVerifyErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/credentials/verify`),
            json: body,
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(400, "*", handler.badRequest)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }
}

/**
 * Error handler for RequestCredential
 */
export type RequestCredentialErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Error handler for PostCredentialsApprove
 */
export type PostCredentialsApproveErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Error handler for PostCredentialsReject
 */
export type PostCredentialsRejectErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Error handler for GetCredentialsMyUserdid
 */
export type GetCredentialsMyUserdidErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Error handler for GetCredentialsRequestRequestid
 */
export type GetCredentialsRequestRequestidErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Error handler for PostCredentialsVerify
 */
export type PostCredentialsVerifyErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

