// Reserved for license

"use strict";

import { Monitor } from "../monitor";
import { Config } from "./config";

/**
 * File storage mode - only filesystem storage supported on backend
 * BSV storage is handled entirely by the frontend with the user's wallet
 */
export type FileStorageMode = "fs";

/**
 * File storage configuration 
 * Only local filesystem storage - BSV storage is handled by frontend
 */
export class FileStorageConfig {

    /**
     * Gets the configuration instance.
     */
    public static getInstance(): FileStorageConfig {
        if (FileStorageConfig.instance) {
            return FileStorageConfig.instance;
        }

        const config: FileStorageConfig = new FileStorageConfig();

        // Only filesystem storage mode is supported on backend
        // BSV storage is handled entirely by frontend with user's wallet
        config.storageMode = "fs";
        config.fileSystemPath = process.env.FILE_STORAGE_FS_PATH || "./data";
        config.privateFilesSecret = process.env.FILE_STORAGE_PRIVATE_SECRET || "";
        config.staticFilesBaseURL = process.env.FILE_STORAGE_SERVER_URL || Config.getInstance().getBackendURI("/static/");

        if (!config.privateFilesSecret) {
            Monitor.warning("The FILE_STORAGE_PRIVATE_SECRET variable is not set or empty. Private files authentication will fail.");
        }

        FileStorageConfig.instance = config;

        return config;
    }
    private static instance: FileStorageConfig = null;

    public storageMode: FileStorageMode;

    public staticFilesBaseURL: string;

    public privateFilesSecret: string;

    public fileSystemPath: string;

    constructor() {
        this.storageMode = "fs";
        this.fileSystemPath = "./data";
        this.privateFilesSecret = "secret";
        this.staticFilesBaseURL = "/static/";
    }
}
