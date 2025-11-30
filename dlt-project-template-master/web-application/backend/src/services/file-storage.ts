// Reserved for license

"use strict";

import { FileStorageConfig, FileStorageMode } from "../config/config-file-storage";
import { resolveURL } from "../utils/http-utils";
import { FileStorageFileSystem } from "./file-storage-fs";
import { Readable } from "stream";
import JWT from "jsonwebtoken";

/**
 * Signature algorithm for file access authentication tokens
 */
export const TOKEN_SIGN_ALGO: JWT.Algorithm = "HS256";

/**
 * Subject for file access authentication tokens
 */
export const TOKEN_SUBJECT = "file_access";

/**
 * Default expiration time of tokens (seconds)
 */
const DEFAULT_TOKEN_EXPIRATION = 24 * 60 * 60;

/**
 * This service manages the file storage (filesystem only)
 * BSV blockchain storage is handled entirely by the frontend with the user's wallet
 */
export class FileStorageService {
    public static instance: FileStorageService = null;

    public static getInstance(): FileStorageService {
        if (FileStorageService.instance) {
            return FileStorageService.instance;
        } else {
            FileStorageService.instance = new FileStorageService();
            return FileStorageService.instance;
        }
    }

    private mode: FileStorageMode;

    constructor() {
        this.mode = FileStorageConfig.getInstance().storageMode;
    }

    /**
     * Starts the file storage service
     */
    public async start(): Promise<void> {
        // Filesystem storage doesn't need async initialization
    }

    /**
     * Gets URL for static file, using the file storage key
     * @param key The file storage key (path)
     * @param expirationSeconds The expiration time for the URL (seconds)
     * @returns The file URL
     */
    public getStaticFileURL(key: string, expirationSeconds?: number): string {
        if (!key) {
            return "";
        }

        if (key.startsWith("public/")) {
            return resolveURL(key, FileStorageConfig.getInstance().staticFilesBaseURL);
        } else {
            const authToken = JWT.sign(
                {
                    sub: TOKEN_SUBJECT,
                    key: key,
                },
                FileStorageConfig.getInstance().privateFilesSecret,
                {
                    algorithm: TOKEN_SIGN_ALGO, 
                    expiresIn: expirationSeconds || DEFAULT_TOKEN_EXPIRATION
                }
            );
            return resolveURL(key + "?auth=" + encodeURIComponent(authToken), FileStorageConfig.getInstance().staticFilesBaseURL);
        }
    }

    /**
     * Verifies authentication token for static file
     * @param key The file storage key
     * @param token The authentication token
     * @returns True if verified
     */
    public verifyAuthToken(key: string, token: string): boolean {
        try {
            const jwt = JWT.verify(token, FileStorageConfig.getInstance().privateFilesSecret, {algorithms: [TOKEN_SIGN_ALGO]}) as JWT.JwtPayload;
            return jwt.sub === TOKEN_SUBJECT && (jwt.key + "") === key;
        } catch (ex) {
            return false;
        }
    }

    /**
     * Generates a random file key
     * @param isPublic True if the file will be public
     * @param ext The file extension
     * @returns the file key
     */
    public async getRandomKey(isPublic: boolean, ext?: string): Promise<string> {
        return FileStorageFileSystem.getInstance().getRandomKey(isPublic, ext);
    }

    /**
     * Checks if the object exists
     * @param key Object key
     * @returns True if the object exists
     */
    public async checkExists(key: string): Promise<boolean> {
        return FileStorageFileSystem.getInstance().checkExists(key);
    }

    /**
     * Gets contents of an object
     * @param key Object key
     * @returns Object contents
     */
    public async getObjectContents(key: string): Promise<Buffer> {
        return FileStorageFileSystem.getInstance().getObjectContents(key);
    }

    /**
     * Gets contents of an object as stream
     * @param key Object key
     * @returns Object contents
     */
    public async getObjectContentsStream(key: string): Promise<Readable> {
        return FileStorageFileSystem.getInstance().getObjectContentsStream(key);
    }

    /**
     * Set object contents
     * @param key Object key
     * @param contents Contents (as string or Buffer)
     * @returns The storage key
     */
    public async setObjectContents(key: string, contents: string | Buffer): Promise<string> {
        await FileStorageFileSystem.getInstance().setObjectContents(key, contents);
        return key;
    }

    /**
     * Uploads file from disk
     * @param key Object key
     * @param file Path to file on disk
     * @returns The storage key
     */
    public async uploadFile(key: string, file: string): Promise<string> {
        await FileStorageFileSystem.getInstance().uploadFile(key, file);
        return key;
    }

    /**
     * Deletes file from storage
     * @param key Key
     */
    public async deleteFile(key: string): Promise<void> {
        return FileStorageFileSystem.getInstance().deleteFile(key);
    }
}
