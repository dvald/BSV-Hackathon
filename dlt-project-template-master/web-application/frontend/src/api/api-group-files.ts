// API bindings: files (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonErrorHandler } from "@asanrom/request-browser";
import { getApiUrl } from "./utils";

export class ApiFiles {
    /**
     * Method: POST
     * Path: /files/upload
     * Upload a file, store it locally, and calculate SHA256 hash
     * @param formParams FromData parameters
     * @returns The request parameters
     */
    public static PostFilesUpload(formParams: PostFilesUploadFormParameters): RequestParams<void, CommonErrorHandler> {
        const formData = new FormData();

        formData.append("file", formParams.file);
        formParams.bucket !== undefined && formData.append("bucket", formParams.bucket);
        formParams.isPublic !== undefined && formData.append("isPublic", formParams.isPublic);

        return {
            method: "POST",
            url: getApiUrl(`/files/upload`),
            form: formData,
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
     * Path: /files/{fileId}
     * Get file info by ID
     * @param fileId File storage ID
     * @returns The request parameters
     */
    public static GetFilesFileid(fileId: string): RequestParams<void, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/files/${encodeURIComponent(fileId)}`),
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
     * Path: /files/config
     * Get storage configuration
     * @returns The request parameters
     */
    public static GetFilesConfig(): RequestParams<void, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/files/config`),
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
 * Form parameters for PostFilesUpload
 */
export interface PostFilesUploadFormParameters {
    /**
     * The file to upload
     */
    file: File;

    /**
     * Optional bucket/category
     */
    bucket?: string;

    /**
     * Whether file is public (default: false)
     */
    isPublic?: boolean;
}

