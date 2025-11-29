// Reserved for license

"use strict";

import { createHash } from "crypto";

/**
 * Result of anchoring a file hash on BSV
 */
export interface HashAnchorResult {
    hash: string;
    txid?: string;
    note?: string;
}

/**
 * Service for calculating file hashes
 * For the hackathon: calculates SHA256 hash as proof of file integrity
 * The hash can be verified independently and optionally anchored on BSV later
 */
export class BsvHashAnchorService {
    private static instance: BsvHashAnchorService = null;

    public static getInstance(): BsvHashAnchorService {
        if (!BsvHashAnchorService.instance) {
            BsvHashAnchorService.instance = new BsvHashAnchorService();
        }
        return BsvHashAnchorService.instance;
    }

    /**
     * Calculate SHA256 hash of a buffer
     * @param data File data as buffer
     * @returns Hex string of SHA256 hash
     */
    public calculateHash(data: Buffer): string {
        return createHash("sha256").update(data).digest("hex");
    }

    /**
     * Calculate hash and return result
     * @param data File data
     * @param metadata Optional metadata
     * @returns Hash result with SHA256 hex string
     */
    public hashFile(data: Buffer, metadata?: { fileName?: string; mimeType?: string }): HashAnchorResult {
        const hash = this.calculateHash(data);
        return {
            hash,
            note: "SHA256 hash calculated. This hash can be used to verify file integrity.",
        };
    }
}
