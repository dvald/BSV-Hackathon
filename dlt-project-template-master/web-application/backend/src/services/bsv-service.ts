"use strict";

import { PrivateKey, KeyDeriver, WalletInterface, PushDrop, Utils, Script } from '@bsv/sdk';
import { Wallet, WalletStorageManager, WalletSigner, Services, StorageClient, Chain } from '@bsv/wallet-toolbox';
import { BsvConfig } from "../config/config-bsv";
import { Monitor } from "../monitor";
import { Campaign } from "../models/crowdfunding/campaign";
import { Investment } from "../models/crowdfunding/investment";
import { DataFilter } from "tsbean-orm";

/**
 * BSV Service
 */
export class BsvService {
    /* Singleton */
    public static instance: BsvService = null;

    public static getInstance(): BsvService {
        if (BsvService.instance !== null) {
            return BsvService.instance;
        } else {
            BsvService.instance = new BsvService();
            return BsvService.instance;
        }
    }

    private wallet: WalletInterface;
    private identityKey: string;
    private address: string;

    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this.initializeWallet();
        this.initPromise.catch(err => {
            Monitor.error("Failed to initialize BSV Wallet: " + err.message);
        });
    }

    public async ready() {
        await this.initPromise;
    }

    /**
     * Initializes the backend wallet
     */
    private async initializeWallet() {
        const config = BsvConfig.getInstance();
        const privateKeyStr = config.privateKey;
        const network = (config.network || 'main') as Chain;

        if (!privateKeyStr) {
            Monitor.error("BSV_PRIVATE_KEY not set. BSV Service will not function correctly.");
            return;
        }

        try {
            // Support both WIF and HEX formats
            let privateKey: PrivateKey;
            if (privateKeyStr.startsWith('K') || privateKeyStr.startsWith('L') || privateKeyStr.startsWith('5')) {
                // WIF format (mainnet compressed starts with K or L, uncompressed with 5)
                Monitor.info("[BsvService] Detected WIF format private key");
                privateKey = PrivateKey.fromWif(privateKeyStr);
            } else {
                // HEX format
                Monitor.info("[BsvService] Detected HEX format private key");
                privateKey = PrivateKey.fromHex(privateKeyStr);
            }
            
            this.address = privateKey.toAddress().toString();
            Monitor.info(`[BsvService] Derived address: ${this.address}`);
            
            const keyDeriver = new KeyDeriver(privateKey);
            this.identityKey = keyDeriver.identityKey;

            const storageManager = new WalletStorageManager(keyDeriver.identityKey);
            const signer = new WalletSigner(network, keyDeriver, storageManager);
            const services = new Services(network);
            const walletInstance = new Wallet(signer, services);

            // Setup storage (using default Babbage storage for now, can be configured)
            const storageUrl = 'https://storage.babbage.systems';
            const client = new StorageClient(walletInstance, storageUrl);
            await client.makeAvailable();
            await storageManager.addWalletStorageProvider(client);

            this.wallet = walletInstance;
            Monitor.info(`BSV Backend wallet initialized. Identity: ${this.identityKey} Address: ${this.address}`);
        } catch (error) {
            Monitor.error("Error initializing BSV wallet: " + error.message);
            throw error;
        }
    }

    /**
     * Fetches a transaction from the blockchain
     * @param txid Transaction ID
     */
    public async getTransaction(txid: string): Promise<string> {
        try {
            const response = await fetch(`https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`);
            if (!response.ok) {
                throw new Error(`Failed to fetch transaction: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            Monitor.error(`Error fetching transaction ${txid}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Returns the wallet identity key
     */
    public getIdentityKey(): string {
        return this.identityKey;
    }

    /**
     * Returns the wallet address
     */
    public getAddress(): string {
        return this.address;
    }

    /**
     * Gets the BRC-29 derived address where funds are actually received
     * Extracts the address from the first funded output's locking script
     */
    public async getFundedAddress(): Promise<string | null> {
        if (!this.wallet) {
            return null;
        }

        try {
            // List outputs with locking scripts to find actual addresses
            const result = await this.wallet.listOutputs({
                basket: 'default',
                include: 'locking scripts',
                limit: 10
            });

            Monitor.info(`[getFundedAddress] Found ${result?.outputs?.length || 0} outputs`);

            if (result && result.outputs && result.outputs.length > 0) {
                // Find the first output with satoshis and extract the address
                for (const output of result.outputs) {
                    Monitor.info(`[getFundedAddress] Output: ${output.satoshis} sats, lockingScript: ${output.lockingScript?.substring(0, 50)}...`);
                    
                    if (output.satoshis && output.satoshis > 0 && output.lockingScript) {
                        try {
                            // Parse P2PKH script to extract address
                            // P2PKH format: OP_DUP OP_HASH160 <20 bytes pubkeyhash> OP_EQUALVERIFY OP_CHECKSIG
                            // Hex: 76a914<40 hex chars>88ac
                            const scriptHex = output.lockingScript;
                            if (scriptHex.startsWith('76a914') && scriptHex.endsWith('88ac')) {
                                const pubKeyHash = scriptHex.substring(6, 46); // Extract 20 bytes (40 hex chars)
                                // Convert pubKeyHash to address using base58check
                                const address = this.pubKeyHashToAddress(pubKeyHash);
                                Monitor.info(`[getFundedAddress] Derived address: ${address}`);
                                return address;
                            }
                        } catch (e) {
                            Monitor.error(`[getFundedAddress] Error parsing script: ${e}`);
                        }
                    }
                }
            }
            
            return null;
        } catch (error: any) {
            Monitor.error(`[getFundedAddress] Error: ${error.message}`);
            return null;
        }
    }

    /**
     * Converts a public key hash (hex) to a Bitcoin address
     */
    private pubKeyHashToAddress(pubKeyHashHex: string): string {
        const crypto = require('crypto');
        
        // Add version byte (0x00 for mainnet)
        const versionedPayload = '00' + pubKeyHashHex;
        const payloadBuffer = Buffer.from(versionedPayload, 'hex');
        
        // Double SHA256 for checksum
        const hash1 = crypto.createHash('sha256').update(payloadBuffer).digest();
        const hash2 = crypto.createHash('sha256').update(hash1).digest();
        const checksum = hash2.slice(0, 4);
        
        // Concatenate and encode in base58
        const fullPayload = Buffer.concat([payloadBuffer, checksum]);
        return this.base58Encode(fullPayload);
    }

    /**
     * Base58 encoding for Bitcoin addresses
     */
    private base58Encode(buffer: Buffer): string {
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let num = BigInt('0x' + buffer.toString('hex'));
        let result = '';
        
        while (num > 0) {
            const remainder = Number(num % 58n);
            num = num / 58n;
            result = ALPHABET[remainder] + result;
        }
        
        // Add leading zeros
        for (const byte of buffer) {
            if (byte === 0) {
                result = '1' + result;
            } else {
                break;
            }
        }
        
        return result;
    }

    /**
     * Returns the wallet instance
     */
    public getWallet(): WalletInterface {
        return this.wallet;
    }

    /**
     * Gets the current crowdfunding status
     */
    public async getStatus() {
        // For this demo, we assume a single active campaign. 
        // In a real app, we would look up by ID.
        // We'll fetch the first campaign or create a default one if none exists.

        let campaign = (await Campaign.finder.find(DataFilter.any(), undefined))[0];

        if (!campaign) {
            // Create default campaign if not exists (Migration/Seed logic)
            campaign = new Campaign({
                id: "default-campaign",
                goal: 100,
                raised: 0,
                isComplete: false,
                completionTxid: ""
            });
            await campaign.insert();
        }

        const investments = await Investment.finder.find(DataFilter.equals("campaignId", campaign.id));
        const investorCount = new Set(investments.map(i => i.identityKey)).size;

        return {
            goal: campaign.goal,
            raised: campaign.raised,
            investorCount: investorCount,
            isComplete: campaign.isComplete,
            percentFunded: campaign.goal > 0 ? Math.round((campaign.raised / campaign.goal) * 100) : 0,
            investors: investments.map(inv => ({
                identityKey: inv.identityKey,
                amount: inv.amount,
                timestamp: inv.timestamp
            }))
        };
    }

    /**
     * Records a new investment
     * @param identityKey Investor identity key
     * @param amount Amount in satoshis
     */
    public async recordInvestment(identityKey: string, amount: number) {
        let campaign = (await Campaign.finder.find(DataFilter.any(), undefined))[0];
        if (!campaign) {
            campaign = new Campaign({
                id: "default-campaign",
                goal: 100,
                raised: 0,
                isComplete: false,
                completionTxid: ""
            });
            await campaign.insert();
        }

        const investment = new Investment({
            id: Date.now().toString() + "-" + Math.random().toString(36).substring(7),
            campaignId: campaign.id,
            identityKey: identityKey,
            amount: amount,
            timestamp: Date.now(),
            redeemed: false
        });

        await investment.insert();

        // Update campaign stats
        campaign.raised += amount;
        await campaign.save();

        return {
            success: true,
            amount: amount,
            totalRaised: campaign.raised,
            message: "Investment received! Tokens will be distributed when goal is reached."
        };
    }
    /**
     * Completes the crowdfunding campaign and distributes tokens
     */
    public async completeCrowdfunding() {
        const campaign = (await Campaign.finder.find(DataFilter.any(), undefined))[0];
        if (!campaign) {
            throw new Error("Campaign not found");
        }

        if (campaign.raised < campaign.goal) {
            throw new Error(`Goal not reached. Raised: ${campaign.raised}, Goal: ${campaign.goal}`);
        }

        if (campaign.isComplete) {
            throw new Error("Campaign already completed");
        }

        // Find unredeemed investments
        const investments = await Investment.finder.find(DataFilter.equals("redeemed", false));

        if (investments.length === 0) {
            // Check if all are redeemed
            const allInvestments = await Investment.finder.find(DataFilter.equals("campaignId", campaign.id));
            if (allInvestments.length > 0 && allInvestments.every(i => i.redeemed)) {
                campaign.isComplete = true;
                await campaign.save();
                return { message: "All tokens already distributed. Campaign marked complete.", txid: campaign.completionTxid };
            }
            throw new Error("No unredeemed investments found.");
        }

        const pushdrop = new PushDrop(this.wallet as any); // Type cast if needed due to SDK version mismatch
        let lastTxid = "";
        let lastTx: number[] | undefined = undefined;

        // Process one by one (or batch if possible, but simple loop for now)
        for (const investment of investments) {
            try {
                const tokenDescription = `Crowdfunding token for ${investment.amount} sats`;

                // Encrypt token data
                const { ciphertext } = await this.wallet.encrypt({
                    plaintext: Utils.toArray(tokenDescription, 'utf8'),
                    protocolID: [0, 'token list'],
                    keyID: '1',
                    counterparty: 'anyone'
                });

                // Create locking script
                const lockingScript = await pushdrop.lock(
                    [ciphertext],
                    [0, 'token list'],
                    '1',
                    investment.identityKey
                );

                // Create token transaction
                const result = await this.wallet.createAction({
                    description: `Create token for ${investment.identityKey.substring(0, 8)}...`,
                    outputs: [
                        {
                            lockingScript: lockingScript.toHex(),
                            satoshis: 1,
                            basket: 'crowdfunding',
                            outputDescription: 'Crowdfunding token'
                        }
                    ],
                    options: {
                        randomizeOutputs: false
                    }
                });

                investment.redeemed = true;
                await investment.save();
                lastTxid = result.txid;
                lastTx = result.tx; // Store the transaction
                Monitor.info(`Distributed token to ${investment.identityKey}. TXID: ${result.txid}`);

            } catch (error) {
                Monitor.error(`Failed to distribute token to ${investment.identityKey}: ${error.message}`);
                // Continue with others
            }
        }

        // Check if all are now redeemed
        const remainingUnredeemed = await Investment.finder.find(DataFilter.equals("redeemed", false));
        if (remainingUnredeemed.length === 0) {
            campaign.isComplete = true;
            campaign.completionTxid = lastTxid;
            await campaign.save();
        }

        return {
            success: true,
            message: "Token distribution process completed",
            lastTxid: lastTxid,
            tx: lastTx,
            remainingUnredeemed: remainingUnredeemed.length
        };
    }
    /**
     * Resets the crowdfunding campaign (Development only)
     */
    public async resetCrowdfunding() {
        // Delete all investments
        const investments = await Investment.finder.find(DataFilter.any(), undefined);
        for (const inv of investments) {
            await inv.delete();
        }

        // Reset campaign
        const campaigns = await Campaign.finder.find(DataFilter.any(), undefined);
        for (const camp of campaigns) {
            camp.raised = 0;
            camp.isComplete = false;
            camp.completionTxid = "";
            await camp.save();
        }

        return { message: "Crowdfunding campaign reset successfully." };
    }

    /**
     * Helper: Convert string to hex for OP_RETURN
     */
    private stringToHex(str: string): string {
        return Buffer.from(str, "utf8").toString("hex");
    }

    /**
     * Gets the wallet balance using the SDK's listOutputs
     * This gets the real balance from BRC-29 derived outputs
     * @returns Balance in satoshis and BSV, plus output count
     */
    public async getBalance(): Promise<{ satoshis: number; bsv: number; address: string; outputCount: number }> {
        if (!this.wallet) {
            throw new Error("Wallet not initialized");
        }

        try {
            Monitor.info(`[getBalance] Fetching wallet balance using SDK listOutputs...`);
            
            // List all spendable outputs from the wallet
            const result = await this.wallet.listOutputs({
                basket: 'default',
                include: 'locking scripts',
                limit: 1000
            });
            
            // Sum up all spendable satoshis
            let totalSatoshis = 0;
            const outputCount = result?.outputs?.length || 0;
            
            if (result && result.outputs) {
                for (const output of result.outputs) {
                    if (output.satoshis) {
                        totalSatoshis += output.satoshis;
                    }
                }
            }
            
            Monitor.info(`[getBalance] SDK balance: ${totalSatoshis} satoshis from ${outputCount} outputs`);
            
            // If SDK returns 0, also check the base address as fallback
            if (totalSatoshis === 0 && this.address) {
                try {
                    const wocResponse = await fetch(`https://api.whatsonchain.com/v1/bsv/main/address/${this.address}/balance`);
                    if (wocResponse.ok) {
                        const wocData = await wocResponse.json();
                        const wocBalance = (wocData.confirmed || 0) + (wocData.unconfirmed || 0);
                        if (wocBalance > 0) {
                            Monitor.info(`[getBalance] WhatsonChain fallback: ${wocBalance} satoshis`);
                            totalSatoshis = wocBalance;
                        }
                    }
                } catch (e) {
                    // Ignore fallback errors
                }
            }
            
            return {
                satoshis: totalSatoshis,
                bsv: totalSatoshis / 100000000,
                address: this.address || 'Wallet',
                outputCount: outputCount
            };
        } catch (error: any) {
            Monitor.error(`[getBalance] Error: ${error.message}`);
            Monitor.error(`[getBalance] Stack: ${error.stack}`);
            throw error;
        }
    }

    /**
     * Writes data to BSV blockchain using OP_RETURN
     * Used for token economy events (MINT, BURN, TRANSFER)
     * @param data Object containing event data to anchor on blockchain
     * @returns Transaction ID or null if failed
     */
    public async writeOpReturn(data: { event: string; token: string; amount: number; user: string; timestamp?: number }): Promise<string | null> {
        if (!this.wallet) {
            Monitor.error("[writeOpReturn] Wallet not initialized");
            return null;
        }

        try {
            // Add timestamp if not provided
            const eventData = {
                ...data,
                timestamp: data.timestamp || Date.now()
            };

            const jsonData = JSON.stringify(eventData);
            
            // Build OP_RETURN script: OP_FALSE OP_RETURN <hex_data>
            const asmParts = ["OP_FALSE", "OP_RETURN", this.stringToHex(jsonData)];
            const opReturnScript = Script.fromASM(asmParts.join(" "));

            const result = await this.wallet.createAction({
                outputs: [{
                    lockingScript: opReturnScript.toHex(),
                    satoshis: 0,
                    outputDescription: `Token ${eventData.event}: ${eventData.token}`
                }],
                description: `Token Event: ${eventData.event} ${eventData.amount} ${eventData.token}`,
                options: { randomizeOutputs: false }
            });

            if (result.txid) {
                Monitor.info(`[writeOpReturn] ✓ Event anchored: ${result.txid} - ${eventData.event} ${eventData.amount} ${eventData.token}`);
                return result.txid;
            } else {
                throw new Error("No txid returned from createAction");
            }
        } catch (error: any) {
            Monitor.error(`[writeOpReturn] Failed to anchor event: ${error.message}`);
            Monitor.error(`[writeOpReturn] Full error: ${JSON.stringify(error)}`);
            // Throw the error so callers know what happened
            throw error;
        }
    }
}
