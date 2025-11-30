// Reserved for license

"use strict";

import { createHash } from "crypto";
import { PrivateKey, KeyDeriver, Script } from "@bsv/sdk";
import { Wallet, WalletStorageManager, WalletSigner, Services, StorageClient, Chain } from "@bsv/wallet-toolbox";
import { BsvConfig } from "../config/config-bsv";

/**
 * Result of anchoring a file hash on BSV
 */
export interface HashAnchorResult {
    hash: string;
    txid?: string;
    note?: string;
}

/**
 * Service for calculating file hashes and anchoring on BSV blockchain
 * For the hackathon: calculates SHA256 hash and automatically anchors on BSV
 */
export class BsvHashAnchorService {
    private static instance: BsvHashAnchorService = null;
    private wallet: Wallet | null = null;
    private identityKey: string | null = null;
    private initialized: boolean = false;
    private initPromise: Promise<void> | null = null;

    public static getInstance(): BsvHashAnchorService {
        if (!BsvHashAnchorService.instance) {
            BsvHashAnchorService.instance = new BsvHashAnchorService();
        }
        return BsvHashAnchorService.instance;
    }

    /**
     * Initialize the BSV wallet for backend anchoring
     */
    private async initializeWallet(): Promise<void> {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            const bsvConfig = BsvConfig.getInstance();
            const privateKeyHex = bsvConfig.privateKey;
            if (!privateKeyHex) {
                console.warn("[BsvHashAnchor] BSV_PRIVATE_KEY not configured - anchoring disabled");
                return;
            }

            try {
                const network = (bsvConfig.network || "main") as Chain;
                const storageUrl = "https://storage.babbage.systems";

                const privateKey = PrivateKey.fromHex(privateKeyHex);
                const keyDeriver = new KeyDeriver(privateKey);
                this.identityKey = keyDeriver.identityKey;
                
                const storageManager = new WalletStorageManager(keyDeriver.identityKey);
                const signer = new WalletSigner(network, keyDeriver, storageManager);
                const services = new Services(network);
                this.wallet = new Wallet(signer, services);

                const client = new StorageClient(this.wallet, storageUrl);
                await client.makeAvailable();
                await storageManager.addWalletStorageProvider(client);

                this.initialized = true;
                console.log("[BsvHashAnchor] ✓ Wallet initialized");
                console.log(`[BsvHashAnchor] ✓ Identity: ${this.identityKey}`);
            } catch (err) {
                console.error("[BsvHashAnchor] Failed to initialize wallet:", err);
                this.wallet = null;
            }
        })();

        return this.initPromise;
    }

    /**
     * Calculate SHA256 hash of a buffer
     */
    public calculateHash(data: Buffer): string {
        return createHash("sha256").update(data).digest("hex");
    }

    /**
     * Convert string to hex
     */
    private stringToHex(str: string): string {
        return Buffer.from(str, "utf8").toString("hex");
    }

    /**
     * Calculate hash and return result (without anchoring)
     */
    public hashFile(data: Buffer, metadata?: { fileName?: string; mimeType?: string }): HashAnchorResult {
        const hash = this.calculateHash(data);
        return {
            hash,
            note: "SHA256 hash calculated.",
        };
    }

    /**
     * Calculate hash AND anchor on BSV blockchain automatically
     */
    public async hashAndAnchor(data: Buffer, metadata?: { fileName?: string; mimeType?: string }): Promise<HashAnchorResult> {
        const hash = this.calculateHash(data);
        
        await this.initializeWallet();

        if (!this.wallet) {
            return {
                hash,
                note: "Hash calculated. BSV anchoring not available (wallet not configured).",
            };
        }

        try {
            const timestamp = Date.now().toString();
            const anchorData = [
                "FILE_HASH_ANCHOR",
                hash,
                metadata?.fileName || "unnamed",
                timestamp,
            ];

            const asmParts = ["OP_FALSE", "OP_RETURN"];
            for (const d of anchorData) {
                asmParts.push(this.stringToHex(d));
            }
            const opReturnScript = Script.fromASM(asmParts.join(" "));

            const result = await this.wallet.createAction({
                outputs: [{
                    lockingScript: opReturnScript.toHex(),
                    satoshis: 0,
                    outputDescription: "File hash anchor",
                }],
                description: `Anchor: ${metadata?.fileName || hash.substring(0, 16)}...`,
                options: { randomizeOutputs: false },
            });

            if (result.txid) {
                console.log(`[BsvHashAnchor] ✓ Anchored: ${result.txid}`);
                return {
                    hash,
                    txid: result.txid,
                    note: `Anchored on BSV: https://whatsonchain.com/tx/${result.txid}`,
                };
            } else {
                throw new Error("No txid returned");
            }
        } catch (err: any) {
            console.error("[BsvHashAnchor] Anchor failed:", err.message);
            return {
                hash,
                note: `Hash calculated. Anchoring failed: ${err.message}`,
            };
        }
    }
}
