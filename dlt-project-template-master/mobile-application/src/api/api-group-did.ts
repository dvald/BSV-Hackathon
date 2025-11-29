// API bindings: did (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonErrorHandler } from "@asanrom/request-browser";
import { getApiUrl, generateURIQuery } from "./utils";
import { CreateDIDResponse, CreateDIDRequest, ResolveDIDResponse, GenerateRandomDIDResponse, GenerateRandomDIDRequest, ValidateDIDResponse, ValidateDIDRequest, ExportDIDResponse, ExportDIDRequest } from "./definitions";

export class ApiDid {
    /**
     * Method: POST
     * Path: /did/create
     * Create a new DID
     * Creates a new DID identifier and publishes it to the BSV blockchain
     * @param body Body parameters
     * @returns The request parameters
     */
    public static PostDidCreate(body: CreateDIDRequest): RequestParams<CreateDIDResponse, PostDidCreateErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/did/create` + generateURIQuery({ _time: Date.now() })),
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
     * Path: /did/resolve/{did}
     * Resolve a DID
     * Retrieves and verifies a DID document from the BSV blockchain
     * @param did The DID to resolve - eg: did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
     * @returns The request parameters
     */
    public static GetDidResolveDid(did: string): RequestParams<ResolveDIDResponse, GetDidResolveDidErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/did/resolve/${encodeURIComponent(did)}` + generateURIQuery({ _time: Date.now() })),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(404, "*", handler.notFound)
                    .add(400, "*", handler.badRequest)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: POST
     * Path: /did/generate
     * Generate a random DID
     * Creates a new DID with a randomly generated private key (for testing)
     * @param body Body parameters
     * @returns The request parameters
     */
    public static PostDidGenerate(body: GenerateRandomDIDRequest): RequestParams<GenerateRandomDIDResponse, CommonErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/did/generate` + generateURIQuery({ _time: Date.now() })),
            json: body,
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
     * Path: /did/validate
     * Validate a DID document
     * Validates the structure and format of a DID document
     * @param body Body parameters
     * @returns The request parameters
     */
    public static PostDidValidate(body: ValidateDIDRequest): RequestParams<ValidateDIDResponse, PostDidValidateErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/did/validate` + generateURIQuery({ _time: Date.now() })),
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
     * Path: /did/export
     * Export a DID document
     * Exports a DID document to formatted JSON
     * @param body Body parameters
     * @returns The request parameters
     */
    public static PostDidExport(body: ExportDIDRequest): RequestParams<ExportDIDResponse, PostDidExportErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/did/export` + generateURIQuery({ _time: Date.now() })),
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
 * Error handler for PostDidCreate
 */
export type PostDidCreateErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Error handler for GetDidResolveDid
 */
export type GetDidResolveDidErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;

    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Error handler for PostDidValidate
 */
export type PostDidValidateErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Error handler for PostDidExport
 */
export type PostDidExportErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

