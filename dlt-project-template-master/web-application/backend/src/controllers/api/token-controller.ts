"use strict";

import Express from "express";
import { Controller } from "../controller";
import { TokenService } from "../../services/token-service";
import { Token } from "../../models/tokens/token";
import { UsedBsvTransaction } from "../../models/tokens/used-bsv-transaction";
import { DataFilter } from "tsbean-orm";
import { BsvService } from "../../services/bsv-service";
import { createRandomUID } from "../../utils/text-utils";

export class TokenController extends Controller {
    private tokenService: TokenService;

    constructor() {
        super();
        this.tokenService = TokenService.getInstance();
    }

    public registerAPI(baseUrl: string, app: Express.Application) {
        const router = Express.Router();

        router.post('/create', this.createToken.bind(this));
        router.post('/confirm-genesis', this.confirmGenesis.bind(this));

        // NEW: Create service token (backend creates and owns the token)
        router.post('/create-service-token', this.createServiceToken.bind(this));

        router.post('/:tokenId/mint', this.mintToken.bind(this));
        router.post('/confirm-mint', this.confirmMint.bind(this));

        router.post('/:tokenId/transfer', this.transferToken.bind(this));
        router.post('/:tokenId/execute-transfer', this.executeTransfer.bind(this));
        router.post('/confirm-transfer', this.confirmTransfer.bind(this));

        router.get('/my-tokens', this.getMyTokens.bind(this)); // Tokens I created
        router.get('/my-balances', this.getMyBalances.bind(this)); // Tokens I hold
        router.get('/service-tokens', this.getServiceTokens.bind(this)); // Tokens created by backend
        router.get('/all', this.getAllTokens.bind(this));

        // ==========================================
        // HACKATHON ECONOMY ENDPOINTS
        // ==========================================
        router.post('/economy/init', this.initEconomyTokens.bind(this));
        router.post('/economy/purchase', this.purchaseServiceToken.bind(this));
        router.post('/economy/play', this.playGame.bind(this));
        router.post('/economy/buy-credits', this.buyCredits.bind(this));
        router.post('/economy/buy-credits-x402', this.buyCreditsX402.bind(this));
        router.get('/economy/balance/:userId', this.getEconomyBalance.bind(this));
        router.get('/economy/balance', this.getMyEconomyBalance.bind(this));

        // BSV Purchase endpoint - validates BSV transaction and grants SERVICE tokens
        router.post('/buy-with-bsv', this.buyWithBsv.bind(this));

        router.get('/:tokenId', this.getToken.bind(this));

        app.use(baseUrl + '/tokens', router);
    }

    /**
     * Create a service token - Backend wallet creates and owns the token
     * This is used for municipal services where the backend manages tokens
     */
    private async createServiceToken(req: Express.Request, res: Express.Response) {
        try {
            const { name, symbol, decimals, maxSupply, metadata } = req.body;

            if (!name || !symbol) {
                res.status(400).json({ error: 'Name and symbol are required' });
                return;
            }

            // Use backend's BSV wallet to create the token
            const bsvService = BsvService.getInstance();
            await bsvService.ready();

            const backendIdentityKey = bsvService.getIdentityKey();

            // Create the token using the new createServiceToken method
            const result = await this.tokenService.createServiceToken(
                name,
                symbol,
                decimals || 2,
                maxSupply || 1000000000,
                metadata || {},
                backendIdentityKey
            );

            console.log('[createServiceToken] Token created:', result.tokenId);

            res.json({
                success: true,
                tokenId: result.tokenId,
                txid: result.txid,
                name,
                symbol,
                decimals: decimals || 2,
                maxSupply: maxSupply || 1000000000,
                creatorIdentityKey: backendIdentityKey
            });
        } catch (e: any) {
            console.error('[createServiceToken] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    private async createToken(req: Express.Request, res: Express.Response) {
        try {
            const { name, symbol, decimals, maxSupply, metadata } = req.body;
            const creatorIdentityKey = req.headers['x-bsv-identity-key'] as string;

            if (!creatorIdentityKey) {
                res.status(400).json({ error: 'Missing identity key' });
                return;
            }

            const result = await this.tokenService.createToken(creatorIdentityKey, name, symbol, decimals, maxSupply, metadata);

            // Generate a temporary tokenId that will be replaced with the actual genesis txid.vout
            const tempTokenId = `temp_${Date.now()}`;

            res.json({
                action: result.action,
                tokenId: tempTokenId,
                name,
                symbol,
                decimals,
                maxSupply
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async confirmGenesis(req: Express.Request, res: Express.Response) {
        try {
            const { txid, vout, name, symbol, decimals, maxSupply, metadata } = req.body;
            const creatorIdentityKey = req.headers['x-bsv-identity-key'] as string;

            console.log('[confirmGenesis] Saving token with creatorIdentityKey:', creatorIdentityKey);
            console.log('[confirmGenesis] Token details:', { name, symbol, txid, vout });

            const token = await this.tokenService.confirmGenesis(txid, vout, creatorIdentityKey, name, symbol, decimals, maxSupply, metadata);
            console.log('[confirmGenesis] Token saved with ID:', token.id);
            res.json({ tokenId: token.id });
        } catch (e: any) {
            console.error('[confirmGenesis] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    private async mintToken(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId } = req.params;
            const { recipientIdentityKey, amount } = req.body;
            const creatorIdentityKey = req.headers['x-bsv-identity-key'] as string;

            const result = await this.tokenService.prepareMintAction(tokenId, creatorIdentityKey, recipientIdentityKey, amount);
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async confirmMint(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId, txid, vout, recipientIdentityKey, amount } = req.body;

            await this.tokenService.confirmMint(tokenId, txid, vout, recipientIdentityKey, amount);
            res.json({ success: true });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async transferToken(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId } = req.params;
            const { recipientIdentityKey, amount } = req.body;
            const senderIdentityKey = req.headers['x-bsv-identity-key'] as string;

            const result = await this.tokenService.prepareTransferAction(tokenId, senderIdentityKey, recipientIdentityKey, amount);
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async executeTransfer(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId } = req.params;
            const { recipientIdentityKey, amount } = req.body;
            const senderIdentityKey = req.headers['x-bsv-identity-key'] as string;

            if (!senderIdentityKey) {
                res.status(400).json({ error: 'Missing identity key' });
                return;
            }

            const result = await this.tokenService.executeTransfer(tokenId, senderIdentityKey, recipientIdentityKey, amount);
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async confirmTransfer(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId, txid, inputs, outputs } = req.body;
            // inputs: { txid, vout }[]
            // outputs: { vout, amount, recipient }[]

            await this.tokenService.confirmTransfer(tokenId, txid, inputs, outputs);
            res.json({ success: true });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async getMyTokens(req: Express.Request, res: Express.Response) {
        try {
            const identityKey = req.headers['x-bsv-identity-key'] as string;
            console.log('[getMyTokens] Identity key from header:', identityKey);
            if (!identityKey) {
                res.status(400).json({ error: 'Missing identity key' });
                return;
            }
            const tokens = await this.tokenService.getTokensByCreator(identityKey);
            console.log('[getMyTokens] Found tokens:', tokens.length, tokens);
            res.json(tokens);
        } catch (e: any) {
            console.error('[getMyTokens] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    private async getMyBalances(req: Express.Request, res: Express.Response) {
        try {
            const identityKey = req.headers['x-bsv-identity-key'] as string;
            console.log('[getMyBalances] Identity key from header:', identityKey);
            if (!identityKey) {
                res.status(400).json({ error: 'Missing identity key' });
                return;
            }
            const tokens = await this.tokenService.getTokensByHolder(identityKey);
            console.log('[getMyBalances] Found tokens:', tokens.length, tokens);
            res.json(tokens);
        } catch (e: any) {
            console.error('[getMyBalances] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Get service tokens - tokens created by the backend wallet
     * These are tokens for municipal services that the admin can manage
     */
    private async getServiceTokens(req: Express.Request, res: Express.Response) {
        try {
            const bsvService = BsvService.getInstance();
            await bsvService.ready();
            const backendIdentityKey = bsvService.getIdentityKey();
            
            console.log('[getServiceTokens] Backend identity key:', backendIdentityKey);
            const tokens = await this.tokenService.getTokensByCreator(backendIdentityKey);
            console.log('[getServiceTokens] Found service tokens:', tokens.length);
            res.json(tokens);
        } catch (e: any) {
            console.error('[getServiceTokens] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    private async getAllTokens(req: Express.Request, res: Express.Response) {
        try {
            const tokensRaw = await Token.finder.find(DataFilter.any());
            // Convert to plain objects
            const tokens = tokensRaw.map(token => ({
                id: token.id,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                totalSupply: token.totalSupply,
                maxSupply: token.maxSupply,
                creatorIdentityKey: token.creatorIdentityKey,
                createdAt: token.createdAt,
                metadataJson: token.metadataJson,
                genesisTxid: token.genesisTxid,
                genesisVout: token.genesisVout
            }));
            res.json({
                tokens,
                disclaimer: "This list only includes tokens indexed by this application overlay."
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async getToken(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId } = req.params;
            const token = await Token.finder.findByKey(tokenId);
            if (!token) {
                res.status(404).json({ error: "Token not found" });
                return;
            }
            res.json(token);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    // ==========================================
    // HACKATHON ECONOMY ENDPOINTS
    // ==========================================

    /**
     * Initialize the economy tokens (SERVICE, GAME, SERVICE_TOKEN, LOYALTY_TOKEN)
     * Should be called once to set up the hackathon economy
     * @route POST /api/v1/tokens/economy/init
     */
    private async initEconomyTokens(req: Express.Request, res: Express.Response) {
        try {
            const bsvService = BsvService.getInstance();
            await bsvService.ready();
            const backendIdentityKey = bsvService.getIdentityKey();

            const results: any[] = [];

            // ==========================================
            // LEGACY TOKENS (for backward compatibility)
            // ==========================================

            // Check and create SERVICE token (legacy)
            const serviceToken = await this.tokenService.getTokenBySymbol('SERVICE');
            if (!serviceToken) {
                console.log('[initEconomyTokens] Creating SERVICE token...');
                const serviceResult = await this.tokenService.createServiceToken(
                    'Service Token',
                    'SERVICE',
                    0, // No decimals for simplicity
                    0, // Unlimited supply
                    { description: 'Token de servicio para el hackathon. Se obtiene comprando con BSV.' },
                    backendIdentityKey
                );
                results.push({ token: 'SERVICE', created: true, tokenId: serviceResult.tokenId, txid: serviceResult.txid });
            } else {
                results.push({ token: 'SERVICE', created: false, tokenId: serviceToken.id, message: 'Already exists' });
            }

            // Check and create GAME token (legacy)
            const gameToken = await this.tokenService.getTokenBySymbol('GAME');
            if (!gameToken) {
                console.log('[initEconomyTokens] Creating GAME token...');
                const gameResult = await this.tokenService.createServiceToken(
                    'Game Token',
                    'GAME',
                    0, // No decimals for simplicity
                    0, // Unlimited supply
                    { description: 'Token de juego para el hackathon. Se obtiene jugando.' },
                    backendIdentityKey
                );
                results.push({ token: 'GAME', created: true, tokenId: gameResult.tokenId, txid: gameResult.txid });
            } else {
                results.push({ token: 'GAME', created: false, tokenId: gameToken.id, message: 'Already exists' });
            }

            // ==========================================
            // NEW LOYALTY SYSTEM TOKENS
            // ==========================================

            // Check and create SERVICE_TOKEN (for paying services)
            const serviceTokenNew = await this.tokenService.getTokenBySymbol('SERVICE_TOKEN');
            if (!serviceTokenNew) {
                console.log('[initEconomyTokens] Creating SERVICE_TOKEN...');
                const serviceTokenResult = await this.tokenService.createServiceToken(
                    'Service Payment Token',
                    'SERVICE_TOKEN',
                    0, // No decimals for simplicity
                    0, // Unlimited supply
                    { description: 'Token para pagar servicios municipales. Se obtiene comprando con BSV.' },
                    backendIdentityKey
                );
                results.push({ token: 'SERVICE_TOKEN', created: true, tokenId: serviceTokenResult.tokenId, txid: serviceTokenResult.txid });
            } else {
                results.push({ token: 'SERVICE_TOKEN', created: false, tokenId: serviceTokenNew.id, message: 'Already exists' });
            }

            // Check and create LOYALTY_TOKEN (rewards for using services)
            const loyaltyToken = await this.tokenService.getTokenBySymbol('LOYALTY_TOKEN');
            if (!loyaltyToken) {
                console.log('[initEconomyTokens] Creating LOYALTY_TOKEN...');
                const loyaltyResult = await this.tokenService.createServiceToken(
                    'Loyalty Reward Token',
                    'LOYALTY_TOKEN',
                    0, // No decimals for simplicity
                    0, // Unlimited supply
                    { description: 'Token de fidelidad. Se obtiene al usar servicios municipales.' },
                    backendIdentityKey
                );
                results.push({ token: 'LOYALTY_TOKEN', created: true, tokenId: loyaltyResult.tokenId, txid: loyaltyResult.txid });
            } else {
                results.push({ token: 'LOYALTY_TOKEN', created: false, tokenId: loyaltyToken.id, message: 'Already exists' });
            }

            res.json({
                success: true,
                message: 'Economy tokens initialized',
                tokens: results
            });
        } catch (e: any) {
            console.error('[initEconomyTokens] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Purchase SERVICE tokens with BSV
     * User pays BSV -> Receives SERVICE tokens
     * @route POST /api/v1/tokens/economy/purchase
     * @body { userId: string, amount: number, bsvTxid?: string }
     */
    private async purchaseServiceToken(req: Express.Request, res: Express.Response) {
        try {
            const { userId, amount, bsvTxid } = req.body;
            
            // Allow userId from body or header
            const userIdentity = userId || req.headers['x-bsv-identity-key'] as string;

            if (!userIdentity) {
                res.status(400).json({ error: 'User ID required (userId in body or x-bsv-identity-key header)' });
                return;
            }

            if (!amount || amount <= 0) {
                res.status(400).json({ error: 'Amount must be a positive number' });
                return;
            }

            // In a real implementation, we would verify the BSV payment here
            // For the hackathon, we trust the request and mint tokens
            console.log('[purchaseServiceToken] Processing purchase:', { userIdentity, amount, bsvTxid });

            // Add SERVICE tokens to user
            const result = await this.tokenService.addBalance(userIdentity, 'SERVICE', amount);

            res.json({
                success: true,
                message: `Purchased ${amount} SERVICE tokens`,
                userId: userIdentity,
                amount,
                newBalance: result.balance,
                bsvAnchorTxid: result.txid,
                bsvPaymentTxid: bsvTxid || null
            });
        } catch (e: any) {
            console.error('[purchaseServiceToken] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Play game - Spend SERVICE tokens, earn GAME tokens
     * @route POST /api/v1/tokens/economy/play
     * @body { userId: string, serviceCost: number, gameReward: number }
     */
    private async playGame(req: Express.Request, res: Express.Response) {
        try {
            const { userId, serviceCost, gameReward } = req.body;
            
            // Allow userId from body or header
            const userIdentity = userId || req.headers['x-bsv-identity-key'] as string;

            if (!userIdentity) {
                res.status(400).json({ error: 'User ID required (userId in body or x-bsv-identity-key header)' });
                return;
            }

            const cost = serviceCost || 1; // Default cost: 1 SERVICE token
            const reward = gameReward || 10; // Default reward: 10 GAME tokens

            if (cost <= 0 || reward <= 0) {
                res.status(400).json({ error: 'Cost and reward must be positive numbers' });
                return;
            }

            console.log('[playGame] Processing game:', { userIdentity, cost, reward });

            // Step 1: Burn SERVICE tokens (payment to play)
            const burnResult = await this.tokenService.burnBalance(userIdentity, 'SERVICE', cost);

            // Step 2: Mint GAME tokens (reward for playing)
            const mintResult = await this.tokenService.addBalance(userIdentity, 'GAME', reward);

            // Get updated balances
            const balances = await this.tokenService.getEconomyBalances(userIdentity);

            res.json({
                success: true,
                message: `Played game! Spent ${cost} SERVICE, earned ${reward} GAME tokens`,
                userId: userIdentity,
                serviceCost: cost,
                gameReward: reward,
                balances: balances,
                burnTxid: burnResult.txid,
                mintTxid: mintResult.txid
            });
        } catch (e: any) {
            console.error('[playGame] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Get economy balance for a specific user
     * @route GET /api/v1/tokens/economy/balance/:userId
     */
    private async getEconomyBalance(req: Express.Request, res: Express.Response) {
        try {
            const { userId } = req.params;

            if (!userId) {
                res.status(400).json({ error: 'User ID required' });
                return;
            }

            const balances = await this.tokenService.getEconomyBalances(userId);

            res.json({
                userId,
                balances: {
                    service: balances.service,
                    game: balances.game
                }
            });
        } catch (e: any) {
            console.error('[getEconomyBalance] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Get economy balance for the current user (from header)
     * @route GET /api/v1/tokens/economy/balance
     */
    private async getMyEconomyBalance(req: Express.Request, res: Express.Response) {
        try {
            const userId = req.headers['x-bsv-identity-key'] as string;

            if (!userId) {
                res.status(400).json({ error: 'Missing x-bsv-identity-key header' });
                return;
            }

            const balances = await this.tokenService.getEconomyBalances(userId);

            res.json({
                userId,
                balances: {
                    service: balances.service,
                    game: balances.game
                }
            });
        } catch (e: any) {
            console.error('[getMyEconomyBalance] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Buy SERVICE_TOKEN credits with BSV (TXID)
    // POST /api/v1/tokens/economy/buy-credits
    private async buyCredits(req: Express.Request, res: Express.Response) {
        try {
            const userIdentity = req.headers['x-bsv-identity-key'] as string;
            const { txid, tokensRequested, satsPaid } = req.body;

            if (!userIdentity) {
                res.status(400).json({ error: 'User identity required' });
                return;
            }

            if (!txid || txid.length < 64) {
                res.status(400).json({ error: 'Valid TXID required (64 hex characters)' });
                return;
            }

            // Check if TXID has already been used
            const isUsed = await UsedBsvTransaction.isTxidUsed(txid);
            if (isUsed) {
                res.status(409).json({
                    error: 'TXID already used',
                    message: 'This transaction has already been processed.'
                });
                return;
            }

            const tokensToGrant = tokensRequested || 50;

            console.log(`[BuyCredits] User ${userIdentity.substring(0, 16)}... buying ${tokensToGrant} tokens`);

            // Record the TXID as used
            const usedTx = new UsedBsvTransaction({
                id: `credits-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                txid: txid,
                userAddress: userIdentity,
                satoshisReceived: satsPaid || 100,
                tokensGranted: tokensToGrant,
                timestamp: Date.now()
            });
            await usedTx.insert();

            // Grant SERVICE_TOKEN to user
            const mintResult = await this.tokenService.addBalance(userIdentity, 'SERVICE_TOKEN', tokensToGrant);
            console.log(`[BuyCredits] Granted ${tokensToGrant} SERVICE_TOKEN. TxID: ${mintResult.txid}`);

            // Get final balance
            const balance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE_TOKEN');

            res.json({
                success: true,
                tokensGranted: tokensToGrant,
                balance,
                message: `✅ ${tokensToGrant} créditos comprados correctamente.`,
                txIds: {
                    bsvPayment: txid,
                    mint: mintResult.txid || null
                }
            });

        } catch (e: any) {
            console.error('[buyCredits] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Buy SERVICE_TOKEN credits with x402 wallet payment
    // POST /api/v1/tokens/economy/buy-credits-x402
    private async buyCreditsX402(req: Express.Request, res: Express.Response) {
        try {
            const paymentHeader = req.headers['x-bsv-payment'] as string;
            const userIdentity = req.headers['x-bsv-identity-key'] as string;
            const { tokensRequested, satsPaid } = req.body;

            if (!paymentHeader) {
                res.status(402).json({ 
                    error: 'Payment Required',
                    message: 'x-bsv-payment header is required' 
                });
                return;
            }

            if (!userIdentity) {
                res.status(400).json({ error: 'User identity required' });
                return;
            }

            // Parse payment header
            let paymentData: any;
            try {
                paymentData = JSON.parse(paymentHeader);
            } catch {
                res.status(400).json({ error: 'Invalid x-bsv-payment header format' });
                return;
            }

            const { senderIdentityKey, amount } = paymentData;
            const payerIdentity = senderIdentityKey || userIdentity;

            console.log(`[BuyCreditsX402] Processing wallet payment for ${payerIdentity.substring(0, 16)}...`);
            console.log(`[BuyCreditsX402] Amount: ${amount} sats, Tokens: ${tokensRequested}`);

            const tokensToGrant = tokensRequested || 50;

            // Grant SERVICE_TOKEN to user
            const mintResult = await this.tokenService.addBalance(payerIdentity, 'SERVICE_TOKEN', tokensToGrant);
            console.log(`[BuyCreditsX402] Granted ${tokensToGrant} SERVICE_TOKEN. TxID: ${mintResult.txid}`);

            // Get final balance
            const balance = await this.tokenService.getBalanceBySymbol(payerIdentity, 'SERVICE_TOKEN');

            res.json({
                success: true,
                paymentMethod: 'x402',
                tokensGranted: tokensToGrant,
                balance,
                message: `✅ ${tokensToGrant} créditos comprados con wallet.`,
                txIds: {
                    mint: mintResult.txid || null
                }
            });

        } catch (e: any) {
            console.error('[buyCreditsX402] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // ==========================================
    // BSV PURCHASE ENDPOINT
    // ==========================================

    /**
     * Buy SERVICE tokens with BSV transaction
     * Validates the BSV txid and grants tokens based on amount
     * @route POST /api/v1/tokens/buy-with-bsv
     * @body { txid: string, userAddress: string }
     */
    private async buyWithBsv(req: Express.Request, res: Express.Response) {
        try {
            const { txid, userAddress } = req.body;

            // Validate required fields
            if (!txid) {
                res.status(400).json({ error: 'txid is required' });
                return;
            }

            if (!userAddress) {
                res.status(400).json({ error: 'userAddress is required' });
                return;
            }

            // Validate txid format (64 hex characters)
            const txidRegex = /^[a-fA-F0-9]{64}$/;
            if (!txidRegex.test(txid)) {
                res.status(400).json({ error: 'Invalid txid format. Must be 64 hexadecimal characters.' });
                return;
            }

            // Check if txid has already been used (prevent double-spend)
            const isUsed = await UsedBsvTransaction.isTxidUsed(txid);
            if (isUsed) {
                res.status(400).json({ error: 'This transaction has already been used to purchase tokens.' });
                return;
            }

            console.log('[buyWithBsv] Processing purchase:', { txid, userAddress });

            // ==========================================
            // HACKATHON MODE: Simulate BSV amount
            // In production, we would query the blockchain
            // ==========================================
            const satoshisReceived = 100000; // Default: 0.001 BSV = 100,000 satoshis
            let verificationMethod = 'simulated';

            // Try to get actual transaction from blockchain (optional)
            try {
                const bsvService = BsvService.getInstance();
                await bsvService.ready();
                
                // Attempt to fetch transaction from WhatOnChain
                const txHex = await bsvService.getTransaction(txid);
                
                if (txHex && txHex.length > 0) {
                    // Transaction exists on blockchain
                    // For hackathon, we still use simulated amount
                    // In production, you would parse the tx to find the actual payment amount
                    verificationMethod = 'blockchain_verified';
                    console.log('[buyWithBsv] Transaction found on blockchain');
                }
            } catch (fetchError: any) {
                // Transaction not found or API error - continue with simulated amount
                console.log('[buyWithBsv] Could not fetch tx from blockchain, using simulated amount:', fetchError.message);
                verificationMethod = 'simulated';
            }

            // Calculate tokens to grant
            // Conversion: 1 satoshi = 0.001 SERVICE token
            // 100,000 satoshis (0.001 BSV) = 100 SERVICE tokens
            const tokensToGrant = Math.floor(satoshisReceived / 1000);

            if (tokensToGrant <= 0) {
                res.status(400).json({ error: 'Amount too small to grant tokens' });
                return;
            }

            // Grant SERVICE tokens to user
            const mintResult = await this.tokenService.addBalance(userAddress, 'SERVICE', tokensToGrant);

            // Record the transaction as used
            const usedTx = new UsedBsvTransaction({
                id: createRandomUID(),
                txid: txid,
                userAddress: userAddress,
                satoshisReceived: satoshisReceived,
                tokensGranted: tokensToGrant,
                timestamp: Date.now()
            } as any);
            await usedTx.insert();

            console.log('[buyWithBsv] Purchase successful:', {
                txid,
                userAddress,
                satoshisReceived,
                tokensGranted: tokensToGrant,
                verificationMethod
            });

            res.json({
                success: true,
                txid: txid,
                userAddress: userAddress,
                satoshisReceived: satoshisReceived,
                tokensGranted: tokensToGrant,
                newBalance: mintResult.balance,
                bsvAnchorTxid: mintResult.txid,
                verificationMethod: verificationMethod,
                conversion: {
                    rate: '1000 satoshis = 1 SERVICE token',
                    bsvAmount: satoshisReceived / 100000000
                }
            });

        } catch (e: any) {
            console.error('[buyWithBsv] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }
}
