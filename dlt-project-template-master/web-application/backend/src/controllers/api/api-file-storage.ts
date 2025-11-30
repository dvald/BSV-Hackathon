// Reserved for license

"use strict";

import Express from "express";
import fileUpload from "express-fileupload";
import { Controller } from "../controller";
import { FileStorageService } from "../../services/file-storage";
import { BsvHashAnchorService } from "../../services/bsv-hash-anchor";
import { 
    BAD_REQUEST, 
    getFileUploadMiddleware, 
    INTERNAL_SERVER_ERROR, 
    noCache, 
    sendApiError, 
    sendApiResult 
} from "../../utils/http-utils";
import { clearTempFile, moveUploadedFileToTempFile } from "../../utils/file-utils";
import { readFileSync } from "fs";
import { Document } from "../../models/document";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Result returned after file upload
 */
interface FileUploadResult {
    fileId: string;
    fileName: string;
    mimeType: string;
    size: number;
    hash: string;
    url: string;
    timestamp: number;
    txid?: string; // BSV transaction ID
    documentId: string;
}

/**
 * File Storage API Controller
 * Handles file uploads with hash calculation for BSV proof
 */
export class FileStorageController extends Controller {
    public register(application: Express.Express): void {
        // Called by auto-loader
    }

    public registerAPI(prefix: string, application: Express.Express): void {
        // Upload file and get hash
        application.post(
            prefix + "/files/upload", 
            getFileUploadMiddleware(MAX_FILE_SIZE), 
            this.uploadFile.bind(this)
        );

        // Get file info
        application.get(
            prefix + "/files/:fileId", 
            noCache(this.getFileInfo.bind(this))
        );

        // Get storage config
        application.get(
            prefix + "/files/config", 
            noCache(this.getConfig.bind(this))
        );
    }

    /**
     * Upload a file, store it locally, and calculate SHA256 hash
     * @route POST /files/upload
     * @group files
     * @param {file} file.formData.required - The file to upload
     * @param {string} bucket.formData - Optional bucket/category
     * @param {boolean} isPublic.formData - Whether file is public (default: false)
     * @returns {FileUploadResult} 200 - Upload result with hash
     */
    public async uploadFile(request: Express.Request, response: Express.Response) {
        try {
            // Check for file
            if (!request.files || !request.files.file) {
                sendApiError(request, response, BAD_REQUEST, "NO_FILE", "No file provided");
                return;
            }

            const uploadedFile = request.files.file as fileUpload.UploadedFile;
            const bucket = (request.body.bucket as string) || "default";
            const isPublic = request.body.isPublic === "true" || request.body.isPublic === true;

            // Get file extension (without the dot - getRandomKey adds it)
            const originalName = uploadedFile.name || "file";
            const ext = originalName.includes(".") 
                ? originalName.split(".").pop() 
                : undefined;

            // Generate storage key
            const storageKey = await FileStorageService.getInstance().getRandomKey(isPublic, ext);

            // Move to temp file first
            const tempPath = await moveUploadedFileToTempFile(uploadedFile);

            try {
                // Read file for hash calculation
                const fileBuffer = readFileSync(tempPath);

                // Calculate SHA256 hash AND anchor on BSV automatically
                const hashService = BsvHashAnchorService.getInstance();
                const hashResult = await hashService.hashAndAnchor(fileBuffer, {
                    fileName: originalName,
                    mimeType: uploadedFile.mimetype,
                });

                // Upload to storage
                await FileStorageService.getInstance().uploadFile(storageKey, tempPath);

                // Get URL
                const fileUrl = FileStorageService.getInstance().getStaticFileURL(storageKey);

                // Create document record in database
                const document = await Document.create(
                    originalName,
                    storageKey,
                    uploadedFile.mimetype || "application/octet-stream",
                    uploadedFile.size
                );

                const result: FileUploadResult = {
                    fileId: storageKey,
                    fileName: originalName,
                    mimeType: uploadedFile.mimetype || "application/octet-stream",
                    size: uploadedFile.size,
                    hash: hashResult.hash,
                    url: fileUrl,
                    timestamp: Date.now(),
                    txid: hashResult.txid, // Include BSV transaction ID if anchored
                    documentId: document.id, // Include document ID from database
                };

                sendApiResult(request, response, result);
            } finally {
                // Clean up temp file
                clearTempFile(tempPath);
            }
        } catch (error: any) {
            console.error("File upload error:", error);
            sendApiError(
                request, 
                response, 
                INTERNAL_SERVER_ERROR, 
                "UPLOAD_FAILED", 
                error.message || "File upload failed"
            );
        }
    }

    /**
     * Get file info by ID
     * @route GET /files/{fileId}
     * @group files
     * @param {string} fileId.path.required - File storage ID
     * @returns {object} 200 - File info
     */
    public async getFileInfo(request: Express.Request, response: Express.Response) {
        try {
            const fileId = request.params.fileId;

            if (!fileId) {
                sendApiError(request, response, BAD_REQUEST, "NO_FILE_ID", "File ID required");
                return;
            }

            const exists = await FileStorageService.getInstance().checkExists(fileId);

            if (!exists) {
                sendApiError(request, response, 404, "NOT_FOUND", "File not found");
                return;
            }

            const url = FileStorageService.getInstance().getStaticFileURL(fileId);

            sendApiResult(request, response, {
                fileId,
                url,
                exists: true,
            });
        } catch (error: any) {
            console.error("Get file info error:", error);
            sendApiError(
                request, 
                response, 
                INTERNAL_SERVER_ERROR, 
                "ERROR", 
                error.message || "Failed to get file info"
            );
        }
    }

    /**
     * Get storage configuration
     * @route GET /files/config
     * @group files
     * @returns {object} 200 - Storage config
     */
    public async getConfig(request: Express.Request, response: Express.Response) {
        sendApiResult(request, response, {
            mode: "local",
            hashAlgorithm: "SHA256",
            maxFileSize: MAX_FILE_SIZE,
            note: "Files are stored locally. SHA256 hash is calculated as proof of file integrity.",
        });
    }
}
