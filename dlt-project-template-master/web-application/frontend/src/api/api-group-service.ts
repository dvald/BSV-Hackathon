// API bindings: service (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonErrorHandler } from "@asanrom/request-browser";
import { getApiUrl } from "./utils";
import { ServiceListResponse, ServiceItem, CreateServiceRequest, UpdateServiceRequest, ServiceAdminListResponse, ServiceAdminItem, CreateServiceAdminRequest } from "./definitions";

export class ApiService {
    /**
     * Method: GET
     * Path: /services
     * List all services
     * @returns The request parameters
     */
    public static ListServices(): RequestParams<ServiceListResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/services`),
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
     * Path: /services
     * Create a new service
     * @param body Body parameters
     * @returns The request parameters
     */
    public static CreateService(body: CreateServiceRequest): RequestParams<ServiceItem, CreateServiceErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/services`),
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
     * Path: /services/{id}
     * Get service by ID
     * @param id Service ID
     * @returns The request parameters
     */
    public static GetService(id: string): RequestParams<ServiceItem, GetServiceErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/services/${encodeURIComponent(id)}`),
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
     * Path: /services/{id}
     * Update a service
     * @param id Service ID
     * @param body Body parameters
     * @returns The request parameters
     */
    public static UpdateService(id: string, body: UpdateServiceRequest): RequestParams<ServiceItem, UpdateServiceErrorHandler> {
        return {
            method: "PUT",
            url: getApiUrl(`/services/${encodeURIComponent(id)}`),
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
     * Path: /services/{id}
     * Delete a service
     * @param id Service ID
     * @returns The request parameters
     */
    public static DeleteService(id: string): RequestParams<void, DeleteServiceErrorHandler> {
        return {
            method: "DELETE",
            url: getApiUrl(`/services/${encodeURIComponent(id)}`),
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
     * Path: /service-admins
     * List all service admins
     * @returns The request parameters
     */
    public static ListServiceAdmins(): RequestParams<ServiceAdminListResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/service-admins`),
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
     * Path: /service-admins
     * Create a service admin
     * @param body Body parameters
     * @returns The request parameters
     */
    public static CreateServiceAdmin(body: CreateServiceAdminRequest): RequestParams<ServiceAdminItem, CreateServiceAdminErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/service-admins`),
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
     * Path: /service-admins/{id}
     * Get service admin by ID
     * @param id Record ID
     * @returns The request parameters
     */
    public static GetServiceAdmin(id: string): RequestParams<ServiceAdminItem, GetServiceAdminErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/service-admins/${encodeURIComponent(id)}`),
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
     * Path: /service-admins/{id}
     * Delete a service admin
     * @param id Record ID
     * @returns The request parameters
     */
    public static DeleteServiceAdmin(id: string): RequestParams<void, DeleteServiceAdminErrorHandler> {
        return {
            method: "DELETE",
            url: getApiUrl(`/service-admins/${encodeURIComponent(id)}`),
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
     * Path: /services/{serviceId}/admins
     * Get admins by service
     * @param serviceId Service ID
     * @returns The request parameters
     */
    public static GetAdminsByService(serviceId: string): RequestParams<ServiceAdminListResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/services/${encodeURIComponent(serviceId)}/admins`),
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
 * Error handler for CreateService
 */
export type CreateServiceErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Error handler for GetService
 */
export type GetServiceErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Error handler for UpdateService
 */
export type UpdateServiceErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Error handler for DeleteService
 */
export type DeleteServiceErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Error handler for CreateServiceAdmin
 */
export type CreateServiceAdminErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Error handler for GetServiceAdmin
 */
export type GetServiceAdminErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Error handler for DeleteServiceAdmin
 */
export type DeleteServiceAdminErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

