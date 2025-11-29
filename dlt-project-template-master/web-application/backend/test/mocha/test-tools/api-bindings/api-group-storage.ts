// API bindings: storage (Auto generated)

"use strict";

import { Readable } from "stream";
import FormData from "form-data";
import { RequestErrorHandler, RequestParams, CommonErrorHandler } from "@asanrom/request-axios";
import { getApiUrl, generateURIQuery } from "./utils";
import { BsvStorageConfigResponse, BsvStorageUploadResponse, BsvStorageDownloadResponse, BsvStorageInfoResponse } from "./definitions";

export class ApiStorage {
    /**
     * Method: GET
     * Path: /api/v1/storage/config
     * Get storage configuration
     * @returns The request parameters
     */
    public static GetStorageConfig(): RequestParams<BsvStorageConfigResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/api/v1/storage/config`),
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
     * Path: /api/v1/storage/buckets
     * Get available storage buckets
     * @returns The request parameters
     */
    public static GetStorageBuckets(): RequestParams<string[], CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/api/v1/storage/buckets`),
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
     * Path: /api/v1/storage/upload
     * Upload a file to BSV storage
     * @param formParams FromData parameters
     * @returns The request parameters
     */
    public static UploadFile(formParams: UploadFileFormParameters): RequestParams<BsvStorageUploadResponse, UploadFileErrorHandler> {
        const formData = new FormData();

        formData.append("file", formParams.file);
        formParams.bucket !== undefined && formData.append("bucket", formParams.bucket);
        formParams.isPublic !== undefined && formData.append("isPublic", formParams.isPublic);

        return {
            method: "POST",
            url: getApiUrl(`/api/v1/storage/upload`),
            form: formData as any,
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
     * Path: /api/v1/storage/download/{uhrpUrl}
     * Download a file from BSV storage
     * @param uhrpUrl The UHRP URL of the file (URL encoded)
     * @param queryParams Query parameters
     * @returns The request parameters
     */
    public static DownloadFile(uhrpUrl: string, queryParams: DownloadFileQueryParameters): RequestParams<BsvStorageDownloadResponse, DownloadFileErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/api/v1/storage/download/${encodeURIComponent(uhrpUrl)}` + generateURIQuery(queryParams)),
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
     * Path: /api/v1/storage/info/{uhrpUrl}
     * Get file info from BSV storage
     * @param uhrpUrl The UHRP URL of the file (URL encoded)
     * @returns The request parameters
     */
    public static GetFileInfo(uhrpUrl: string): RequestParams<BsvStorageInfoResponse, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/api/v1/storage/info/${encodeURIComponent(uhrpUrl)}`),
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
 * Error handler for UploadFile
 */
export type UploadFileErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;
};

/**
 * Form parameters for UploadFile
 */
export interface UploadFileFormParameters {
    /**
     * The file to upload
     */
    file: Readable | Buffer;

    /**
     * Storage bucket/category (default: documents)
     */
    bucket?: string;

    /**
     * Whether the file should be public (default: false)
     */
    isPublic?: boolean;
}

/**
 * Error handler for DownloadFile
 */
export type DownloadFileErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 404
     */
    notFound: () => void;
};

/**
 * Query parameters for DownloadFile
 */
export interface DownloadFileQueryParameters {
    /**
     * Whether the file is public (default: false)
     */
    isPublic?: boolean;
}

