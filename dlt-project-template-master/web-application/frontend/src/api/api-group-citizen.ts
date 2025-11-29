// API bindings: citizen (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonErrorHandler } from "@asanrom/request-browser";
import { getApiUrl } from "./utils";
import { CitizenServiceListResponse, CitizenServiceItem, CreateCitizenServiceRequest } from "./definitions";

export class ApiCitizen {
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

