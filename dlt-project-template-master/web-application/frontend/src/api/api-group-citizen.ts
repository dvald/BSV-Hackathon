// API bindings: citizen (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonAuthenticatedErrorHandler, CommonErrorHandler } from "@asanrom/request-browser";
import { getApiUrl } from "./utils";
import { CitizenListResponse, CitizenItem, CreateCitizenRequest, UpdateCitizenRequest, CitizenServiceListResponse, CitizenServiceItem, CreateCitizenServiceRequest } from "./definitions";

export class ApiCitizen {
    /**
     * Method: GET
     * Path: /citizens
     * List all citizens
     * @returns The request parameters
     */
    public static ListCitizens(): RequestParams<CitizenListResponse, CommonAuthenticatedErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/citizens`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: POST
     * Path: /citizens
     * Create a new citizen
     * @param body Body parameters
     * @returns The request parameters
     */
    public static CreateCitizen(body: CreateCitizenRequest): RequestParams<CitizenItem, CreateCitizenErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/citizens`),
            json: body,
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(400, "CITIZEN_ALREADY_EXISTS", handler.badRequestCitizenAlreadyExists)
                    .add(400, "MISSING_UID", handler.badRequestMissingUid)
                    .add(400, "*", handler.badRequest)
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /citizens/{id}
     * Get citizen by ID
     * @param id Citizen ID
     * @returns The request parameters
     */
    public static GetCitizen(id: string): RequestParams<CitizenItem, GetCitizenErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/citizens/${encodeURIComponent(id)}`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(404, "*", handler.notFound)
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: PUT
     * Path: /citizens/{id}
     * Update a citizen
     * @param id Citizen ID
     * @param body Body parameters
     * @returns The request parameters
     */
    public static UpdateCitizen(id: string, body: UpdateCitizenRequest): RequestParams<CitizenItem, UpdateCitizenErrorHandler> {
        return {
            method: "PUT",
            url: getApiUrl(`/citizens/${encodeURIComponent(id)}`),
            json: body,
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(404, "NOT_FOUND", handler.notFoundNotFound)
                    .add(404, "*", handler.notFound)
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: DELETE
     * Path: /citizens/{id}
     * Delete a citizen
     * @param id Citizen ID
     * @returns The request parameters
     */
    public static DeleteCitizen(id: string): RequestParams<void, DeleteCitizenErrorHandler> {
        return {
            method: "DELETE",
            url: getApiUrl(`/citizens/${encodeURIComponent(id)}`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(404, "NOT_FOUND", handler.notFoundNotFound)
                    .add(404, "*", handler.notFound)
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /citizen-services
     * List all citizen-service relations
     * @returns The request parameters
     */
    public static ListCitizenServices(): RequestParams<CitizenServiceListResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/citizen-services`),
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
     * Path: /citizen-services
     * Create a citizen-service relation
     * @param body Body parameters
     * @returns The request parameters
     */
    public static CreateCitizenService(body: CreateCitizenServiceRequest): RequestParams<CitizenServiceItem, CreateCitizenServiceErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/citizen-services`),
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
     * Path: /citizen-services/{id}
     * Get citizen-service relation by ID
     * @param id Record ID
     * @returns The request parameters
     */
    public static GetCitizenService(id: string): RequestParams<CitizenServiceItem, GetCitizenServiceErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/citizen-services/${encodeURIComponent(id)}`),
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
     * Path: /citizen-services/{id}
     * Delete a citizen-service relation
     * @param id Record ID
     * @returns The request parameters
     */
    public static DeleteCitizenService(id: string): RequestParams<void, DeleteCitizenServiceErrorHandler> {
        return {
            method: "DELETE",
            url: getApiUrl(`/citizen-services/${encodeURIComponent(id)}`),
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
     * Path: /services/{serviceId}/citizens
     * Get citizens by service
     * @param serviceId Service ID
     * @returns The request parameters
     */
    public static GetCitizensByService(serviceId: string): RequestParams<CitizenServiceListResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/services/${encodeURIComponent(serviceId)}/citizens`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /citizens/{citizenId}/services
     * Get services by citizen
     * @param citizenId Citizen ID
     * @returns The request parameters
     */
    public static GetServicesByCitizen(citizenId: string): RequestParams<CitizenServiceListResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/citizens/${encodeURIComponent(citizenId)}/services`),
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
 * Error handler for CreateCitizen
 */
export type CreateCitizenErrorHandler = CommonAuthenticatedErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;


};

/**
 * Error handler for GetCitizen
 */
export type GetCitizenErrorHandler = CommonAuthenticatedErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Error handler for UpdateCitizen
 */
export type UpdateCitizenErrorHandler = CommonAuthenticatedErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;

};

/**
 * Error handler for DeleteCitizen
 */
export type DeleteCitizenErrorHandler = CommonAuthenticatedErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;

};

/**
 * Error handler for CreateCitizenService
 */
export type CreateCitizenServiceErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Error handler for GetCitizenService
 */
export type GetCitizenServiceErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Error handler for DeleteCitizenService
 */
export type DeleteCitizenServiceErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

