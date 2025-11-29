// API bindings: credential (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonErrorHandler } from "@asanrom/request-axios";
import { getApiUrl } from "./utils";
import { CredentialTypeListResponse, CredentialTypeItem, CreateCredentialTypeRequest, UpdateCredentialTypeRequest } from "./definitions";

export class ApiCredential {
    /**
     * Method: GET
     * Path: /credential-types
     * List all credential types
     * @returns The request parameters
     */
    public static ListCredentialTypes(): RequestParams<CredentialTypeListResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/credential-types`),
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
     * Path: /credential-types
     * Create a credential type
     * @param body Body parameters
     * @returns The request parameters
     */
    public static CreateCredentialType(body: CreateCredentialTypeRequest): RequestParams<CredentialTypeItem, CreateCredentialTypeErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/credential-types`),
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
     * Path: /credential-types/{id}
     * Get credential type by ID
     * @param id Credential type ID
     * @returns The request parameters
     */
    public static GetCredentialType(id: string): RequestParams<CredentialTypeItem, GetCredentialTypeErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/credential-types/${encodeURIComponent(id)}`),
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
     * Method: PUT
     * Path: /credential-types/{id}
     * Update a credential type
     * @param id Credential type ID
     * @param body Body parameters
     * @returns The request parameters
     */
    public static UpdateCredentialType(id: string, body: UpdateCredentialTypeRequest): RequestParams<CredentialTypeItem, UpdateCredentialTypeErrorHandler> {
        return {
            method: "PUT",
            url: getApiUrl(`/credential-types/${encodeURIComponent(id)}`),
            json: body,
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
     * Method: DELETE
     * Path: /credential-types/{id}
     * Delete a credential type
     * @param id Credential type ID
     * @returns The request parameters
     */
    public static DeleteCredentialType(id: string): RequestParams<void, DeleteCredentialTypeErrorHandler> {
        return {
            method: "DELETE",
            url: getApiUrl(`/credential-types/${encodeURIComponent(id)}`),
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
     * Method: GET
     * Path: /services/{serviceId}/credential-types
     * Get credential types by service
     * @param serviceId Service ID
     * @returns The request parameters
     */
    public static GetCredentialTypesByService(serviceId: string): RequestParams<CredentialTypeListResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/services/${encodeURIComponent(serviceId)}/credential-types`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }
}

/**
 * Error handler for CreateCredentialType
 */
export type CreateCredentialTypeErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Error handler for GetCredentialType
 */
export type GetCredentialTypeErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Error handler for UpdateCredentialType
 */
export type UpdateCredentialTypeErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Error handler for DeleteCredentialType
 */
export type DeleteCredentialTypeErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

