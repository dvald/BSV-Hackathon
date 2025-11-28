"use strict";

import { PrivateKey, KeyDeriver, WalletInterface, PushDrop, Utils } from '@bsv/sdk';
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

    constructor() {
        this.initializeWallet().catch(err => {
            Monitor.error("Failed to initialize BSV Wallet: " + err.message);
        });
    }

    /**
     * Initializes the backend wallet
     */
    private async initializeWallet() {
        const config = BsvConfig.getInstance();
        const privateKeyHex = config.privateKey;
        const network = (config.network || 'main') as Chain;

        if (!privateKeyHex) {
            Monitor.error("BSV_PRIVATE_KEY not set. BSV Service will not function correctly.");
            return;
        }

        try {
            const privateKey = PrivateKey.fromHex(privateKeyHex);
            this.address = privateKey.toAddress().toString();
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
}
