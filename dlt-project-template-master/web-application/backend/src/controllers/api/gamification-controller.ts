"use strict";

import Express from "express";
import { Controller } from "../controller";
import { TokenService } from "../../services/token-service";
import { BsvService } from "../../services/bsv-service";
import { Monitor } from "../../monitor";
import crypto from "crypto";

/**
 * Gamification Controller
 * Implements a loyalty/rewards system where users spend SERVICE_TOKEN
 * to use services and receive LOYALTY_TOKEN as guaranteed rewards.
 * All operations are recorded on BSV blockchain via OP_RETURN.
 */
export class GamificationController extends Controller {
    private tokenService: TokenService;

    // Configuration constants for generic advance action
    private readonly SERVICE_COST = 10;  // Cost in SERVICE tokens to perform an action
    private readonly GAME_REWARD = 5;    // Reward in GAME tokens for participating

    // Service-specific configurations
    private readonly SERVICE_CONFIGS: Record<string, { cost: number; reward: number; name: string; successMessage: string }> = {
        'parking-familia': {
            cost: 50,
            reward: 10,
            name: 'Parking Familia Numerosa',
            successMessage: '¡Plaza reservada! Has ganado 10 puntos de fidelidad.'
        },
        // Alias for backwards compatibility
        'parking-pmr': {
            cost: 50,
            reward: 10,
            name: 'Parking Familia Numerosa',
            successMessage: '¡Plaza reservada! Has ganado 10 puntos de fidelidad.'
        },
        'eco-recycling': {
            cost: 20,
            reward: 5,
            name: 'EcoPoints Reciclaje',
            successMessage: 'Reciclaje registrado. ¡Has ganado 5 puntos de fidelidad!'
        }
    };

    constructor() {
        super();
        this.tokenService = TokenService.getInstance();
    }

    public registerAPI(baseUrl: string, app: Express.Application) {
        const router = Express.Router();

        // Main gamification endpoint (legacy)
        router.post('/advance', this.advance.bind(this));

        // NEW: Use service endpoint for loyalty system (L2 tokens)
        router.post('/use-service', this.useService.bind(this));

        // NEW: Pay for service with BSV (x402 flow + manual TXID)
        router.post('/pay-service', this.payServiceWithBSV.bind(this));

        // NEW: Get payment address for external wallets
        router.get('/payment-address', this.getPaymentAddress.bind(this));

        // NEW: Redeem loyalty points for free service
        router.post('/redeem-loyalty', this.redeemLoyaltyPoints.bind(this));

        // Get user progress/balances
        router.get('/status/:userId', this.getStatus.bind(this));
        router.get('/status', this.getMyStatus.bind(this));

        app.use(baseUrl + '/gamification', router);
        Monitor.debug('[GamificationController] Registered at ' + baseUrl + '/gamification');
    }

    // Get payment address for external wallet payments (BSV Desktop)
    // GET /api/v1/gamification/payment-address
    private async getPaymentAddress(req: Express.Request, res: Express.Response) {
        try {
            const bsvService = BsvService.getInstance();
            await bsvService.ready();

            const address = bsvService.getAddress();
            const satoshisRequired = 100; // 100 sats (avoids dust limit, ~$0.005 USD)

            if (!address) {
                res.status(500).json({ 
                    error: 'BSV wallet not configured',
                    message: 'Backend wallet address not available'
                });
                return;
            }

            res.json({
                success: true,
                address,
                satoshisRequired,
                serviceTokensGranted: 50,
                loyaltyBonus: 10,
                paymentUri: `bitcoin:${address}?amount=${satoshisRequired / 100000000}`,
                instructions: {
                    step1: 'Open your BSV Desktop Wallet',
                    step2: `Send ${satoshisRequired} satoshis to the address above`,
                    step3: 'Copy the transaction ID (TXID)',
                    step4: 'Paste the TXID in the verification field'
                }
            });

        } catch (e: any) {
            Monitor.error(`[Gamification] Error in getPaymentAddress: ${e.message}`);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Advance action - User spends SERVICE tokens and receives GAME tokens as reward
     * This is a guaranteed reward system (no randomness/gambling)
     * 
     * @route POST /api/v1/gamification/advance
     * @body { userId: string, actionId?: string }
     * 
     * Flow:
     * 1. Burn SERVICE tokens (cost to use service)
     * 2. Mint GAME tokens (guaranteed reward for participation)
     * 3. Both operations are recorded on BSV via OP_RETURN
     */
    private async advance(req: Express.Request, res: Express.Response) {
        try {
            const { userId, actionId } = req.body;

            // Allow userId from body or header
            const userIdentity = userId || req.headers['x-bsv-identity-key'] as string;

            if (!userIdentity) {
                res.status(400).json({ 
                    error: 'User ID required (userId in body or x-bsv-identity-key header)' 
                });
                return;
            }

            const action = actionId || 'default_advance';

            Monitor.info(`[Gamification] Processing advance action: ${action} for user: ${userIdentity.substring(0, 16)}...`);

            // Check current SERVICE balance before attempting burn
            const currentServiceBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE');
            
            if (currentServiceBalance < this.SERVICE_COST) {
                // Return 402 Payment Required - insufficient funds
                res.status(402).json({
                    error: 'Insufficient SERVICE tokens to perform action',
                    required: this.SERVICE_COST,
                    available: currentServiceBalance,
                    message: `You need ${this.SERVICE_COST} SERVICE tokens but only have ${currentServiceBalance}`
                });
                return;
            }

            // Step 1: BURN - Charge the user SERVICE tokens
            // This generates an OP_RETURN BURN event on BSV
            let burnResult;
            try {
                burnResult = await this.tokenService.burnBalance(userIdentity, 'SERVICE', this.SERVICE_COST);
            } catch (burnError: any) {
                // Double-check for insufficient balance (race condition protection)
                if (burnError.message.includes('Insufficient')) {
                    res.status(402).json({
                        error: 'Insufficient SERVICE tokens to perform action',
                        required: this.SERVICE_COST,
                        available: 0,
                        message: burnError.message
                    });
                    return;
                }
                throw burnError;
            }

            Monitor.info(`[Gamification] BURN successful: ${this.SERVICE_COST} SERVICE tokens. TxID: ${burnResult.txid}`);

            // Step 2: MINT - Reward the user with GAME tokens (guaranteed)
            // This generates an OP_RETURN MINT event on BSV
            const mintResult = await this.tokenService.addBalance(userIdentity, 'GAME', this.GAME_REWARD);

            Monitor.info(`[Gamification] MINT successful: ${this.GAME_REWARD} GAME tokens. TxID: ${mintResult.txid}`);

            // Get final balances
            const finalBalances = await this.tokenService.getEconomyBalances(userIdentity);

            // Success response
            res.json({
                success: true,
                action: 'advance',
                actionId: action,
                serviceCost: this.SERVICE_COST,
                gameReward: this.GAME_REWARD,
                balances: {
                    service: finalBalances.service,
                    game: finalBalances.game
                },
                transactions: {
                    burnTxid: burnResult.txid || null,
                    mintTxid: mintResult.txid || null
                },
                message: `Action completed! You spent ${this.SERVICE_COST} SERVICE and earned ${this.GAME_REWARD} GAME tokens.`
            });

        } catch (e: any) {
            Monitor.error(`[Gamification] Error in advance: ${e.message}`);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Use Service - Loyalty system endpoint
     * User pays with SERVICE_TOKEN and receives LOYALTY_TOKEN as reward
     * 
     * @route POST /api/v1/gamification/use-service
     * @body { userId: string, serviceId: string }
     * 
     * Flow:
     * 1. Validate service exists and get config
     * 2. BURN SERVICE_TOKEN (payment for service)
     * 3. MINT LOYALTY_TOKEN (guaranteed reward)
     * 4. Both operations recorded on BSV via OP_RETURN
     */
    private async useService(req: Express.Request, res: Express.Response) {
        try {
            const { userId, serviceId } = req.body;

            // Allow userId from body or header
            const userIdentity = userId || req.headers['x-bsv-identity-key'] as string;

            if (!userIdentity) {
                res.status(400).json({ 
                    error: 'User ID required (userId in body or x-bsv-identity-key header)' 
                });
                return;
            }

            if (!serviceId) {
                res.status(400).json({ 
                    error: 'Service ID required',
                    availableServices: Object.keys(this.SERVICE_CONFIGS)
                });
                return;
            }

            // Get service configuration
            const serviceConfig = this.SERVICE_CONFIGS[serviceId];
            if (!serviceConfig) {
                res.status(404).json({ 
                    error: `Service '${serviceId}' not found`,
                    availableServices: Object.keys(this.SERVICE_CONFIGS)
                });
                return;
            }

            const { cost, reward, name, successMessage } = serviceConfig;

            Monitor.info(`[Gamification] Processing use-service: ${serviceId} for user: ${userIdentity.substring(0, 16)}...`);

            // Check current SERVICE_TOKEN balance before attempting burn
            const currentServiceBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE_TOKEN');
            
            if (currentServiceBalance < cost) {
                // Return 402 Payment Required - insufficient funds
                res.status(402).json({
                    error: 'Insufficient SERVICE_TOKEN to use this service',
                    serviceId,
                    serviceName: name,
                    required: cost,
                    available: currentServiceBalance,
                    message: `You need ${cost} SERVICE_TOKEN but only have ${currentServiceBalance}`
                });
                return;
            }

            // Step 1: BURN - Charge the user SERVICE_TOKEN
            // This generates an OP_RETURN BURN event on BSV
            let burnResult;
            try {
                burnResult = await this.tokenService.burnBalance(userIdentity, 'SERVICE_TOKEN', cost);
            } catch (burnError: any) {
                // Double-check for insufficient balance (race condition protection)
                if (burnError.message.includes('Insufficient')) {
                    res.status(402).json({
                        error: 'Insufficient SERVICE_TOKEN to use this service',
                        serviceId,
                        required: cost,
                        available: 0,
                        message: burnError.message
                    });
                    return;
                }
                throw burnError;
            }

            Monitor.info(`[Gamification] BURN successful: ${cost} SERVICE_TOKEN for ${serviceId}. TxID: ${burnResult.txid}`);

            // Step 2: MINT - Reward the user with LOYALTY_TOKEN (guaranteed)
            // This generates an OP_RETURN MINT event on BSV
            const mintResult = await this.tokenService.addBalance(userIdentity, 'LOYALTY_TOKEN', reward);

            Monitor.info(`[Gamification] MINT successful: ${reward} LOYALTY_TOKEN for ${serviceId}. TxID: ${mintResult.txid}`);

            // Get final balances
            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'LOYALTY_TOKEN');

            // Success response
            res.json({
                success: true,
                serviceId,
                serviceName: name,
                cost,
                reward,
                message: successMessage,
                balances: {
                    serviceToken: serviceTokenBalance,
                    loyaltyToken: loyaltyTokenBalance
                },
                txIds: {
                    burn: burnResult.txid || null,
                    mint: mintResult.txid || null
                }
            });

        } catch (e: any) {
            Monitor.error(`[Gamification] Error in useService: ${e.message}`);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Pay for Service with BSV - Hybrid Payment Flow (x402 + Manual TXID)
     * 
     * This endpoint supports two payment methods:
     * 1. x402 AUTOMATIC: Uses x-bsv-payment header (for injected wallets)
     * 2. MANUAL TXID: Uses manualTxid in body (for external wallets like BSV Desktop)
     * 
     * Flow:
     * - If manualTxid provided → process manual payment
     * - If x-bsv-payment header → process x402 payment
     * - If neither → return 402 with payment info
     * 
     * @route POST /api/v1/gamification/pay-service
     * @body { serviceId: string, satoshis?: number, manualTxid?: string }
     */
    private async payServiceWithBSV(req: Express.Request, res: Express.Response) {
        try {
            const { serviceId, satoshis, manualTxid } = req.body;
            const paymentHeader = req.headers['x-bsv-payment'] as string;
            const userIdentity = req.headers['x-bsv-identity-key'] as string;

            // Validate serviceId
            if (!serviceId) {
                res.status(400).json({ 
                    error: 'Service ID required',
                    availableServices: Object.keys(this.SERVICE_CONFIGS)
                });
                return;
            }

            // Get service configuration
            const serviceConfig = this.SERVICE_CONFIGS[serviceId];
            if (!serviceConfig) {
                res.status(404).json({ 
                    error: `Service '${serviceId}' not found`,
                    availableServices: Object.keys(this.SERVICE_CONFIGS)
                });
                return;
            }

            const { cost: tokenCost, reward, name, successMessage } = serviceConfig;

            // Calculate required satoshis (hackathon demo: 100 sats to avoid dust limit)
            const requiredSatoshis = satoshis || 100;
            const tokensToGrant = tokenCost; // SERVICE_TOKEN amount

            // =====================================================
            // MANUAL TXID FLOW: For external wallets (BSV Desktop)
            // =====================================================
            if (manualTxid) {
                Monitor.info(`[Gamification] Processing MANUAL payment for ${serviceId} with TXID: ${manualTxid.substring(0, 16)}...`);
                return await this.processManualPayment(req, res, manualTxid, serviceId, userIdentity, tokensToGrant, reward, name, successMessage);
            }

            // =====================================================
            // x402 FLOW: Check if payment header is present
            // =====================================================
            if (!paymentHeader) {
                // No payment yet - return 402 Payment Required
                Monitor.info(`[Gamification] 402 Payment Required for ${serviceId}`);

                // Generate random derivation prefix
                const derivationPrefix = crypto.randomBytes(16).toString('base64');

                // Get backend address for manual payment option
                const bsvService = BsvService.getInstance();
                await bsvService.ready();
                const backendAddress = bsvService.getAddress();

                // Set payment required headers
                res.set('x-bsv-payment-derivation-prefix', derivationPrefix);
                res.set('x-bsv-payment-satoshis-required', requiredSatoshis.toString());

                res.status(402).json({
                    error: 'Payment Required',
                    message: `Pay ${requiredSatoshis} sats for ${name} and earn ${reward} loyalty points!`,
                    serviceId,
                    serviceName: name,
                    satoshisRequired: requiredSatoshis,
                    loyaltyReward: reward,
                    // Include manual payment info for external wallets
                    manualPayment: {
                        address: backendAddress,
                        paymentUri: `bitcoin:${backendAddress}?amount=${requiredSatoshis / 100000000}`,
                        instructions: 'Send BSV to address, then submit TXID'
                    }
                });
                return;
            }

            // =====================================================
            // x402 PAYMENT RECEIVED - Process the BSV payment
            // =====================================================
            Monitor.info(`[Gamification] Processing x402 BSV payment for ${serviceId}...`);

            let paymentData: any;
            try {
                paymentData = JSON.parse(paymentHeader);
            } catch (parseError) {
                res.status(400).json({ error: 'Invalid x-bsv-payment header format' });
                return;
            }

            const { 
                derivationPrefix, 
                derivationSuffix, 
                transaction, 
                senderIdentityKey, 
                amount 
            } = paymentData;

            if (!transaction || !senderIdentityKey) {
                res.status(400).json({ error: 'Missing transaction or senderIdentityKey in payment header' });
                return;
            }

            // Use senderIdentityKey as the user identity
            const payerIdentity = senderIdentityKey || userIdentity;

            if (!payerIdentity) {
                res.status(400).json({ error: 'Could not determine payer identity' });
                return;
            }

            Monitor.info(`[Gamification] x402 Payment from: ${payerIdentity.substring(0, 16)}... Amount: ${amount} sats`);

            // For hackathon: Accept payment and grant tokens
            // In production, we would:
            // 1. Verify the transaction signature
            // 2. Internalize the transaction to receive funds
            // 3. Wait for confirmation

            try {
                // Get BsvService instance to internalize the transaction
                const bsvService = BsvService.getInstance();
                await bsvService.ready();

                // For hackathon demo, we trust the payment header
                // In production, use wallet.internalizeAction() to verify and receive
                Monitor.info(`[Gamification] BSV payment accepted (hackathon mode)`);

            } catch (bsvError: any) {
                Monitor.warning(`[Gamification] BSV verification skipped (hackathon): ${bsvError.message}`);
                // Continue anyway for hackathon demo
            }

            // BSV Direct Payment = Service is paid directly, NO SERVICE_TOKEN given
            // Only grant LOYALTY_TOKEN as reward for using the service
            const bsvService = BsvService.getInstance();
            
            // Record the BSV payment event on blockchain
            const paymentTxid = await bsvService.writeOpReturn({
                event: 'BSV_SERVICE_PAYMENT',
                token: 'BSV',
                amount: amount || requiredSatoshis,
                user: payerIdentity.substring(0, 16) + '...',
                timestamp: Date.now()
            });
            Monitor.info(`[Gamification] BSV payment recorded on chain. TxID: ${paymentTxid}`);

            // Grant LOYALTY_TOKEN as reward for using the service
            const loyaltyResult = await this.tokenService.addBalance(payerIdentity, 'LOYALTY_TOKEN', reward);
            Monitor.info(`[Gamification] Granted ${reward} LOYALTY_TOKEN as reward. TxID: ${loyaltyResult.txid}`);

            // Get final balances
            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(payerIdentity, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(payerIdentity, 'LOYALTY_TOKEN');

            // Success response
            res.json({
                success: true,
                serviceId,
                serviceName: name,
                paymentMethod: 'BSV',
                bsvPaid: amount || requiredSatoshis,
                loyaltyEarned: reward,
                message: `✅ ${name} pagado con BSV. ¡Has ganado ${reward} puntos de fidelidad!`,
                balances: {
                    serviceToken: serviceTokenBalance,
                    loyaltyToken: loyaltyTokenBalance
                },
                txIds: {
                    bsvPayment: paymentTxid || null,
                    loyalty: loyaltyResult.txid || null
                }
            });

        } catch (e: any) {
            Monitor.error(`[Gamification] Error in payServiceWithBSV: ${e.message}`);
            res.status(500).json({ error: e.message });
        }
    }

    // Process Manual Payment - For external wallets (BSV Desktop)
    // User sends BSV from external wallet, then submits TXID for verification.
    // For hackathon: We trust the TXID format and check it hasn't been used before.
    private async processManualPayment(
        req: Express.Request,
        res: Express.Response,
        txid: string,
        serviceId: string,
        userIdentity: string,
        tokensToGrant: number,
        reward: number,
        serviceName: string,
        successMessage: string
    ) {
        try {
            // Validate TXID format (64 character hex string)
            const txidRegex = /^[a-fA-F0-9]{64}$/;
            if (!txidRegex.test(txid)) {
                res.status(400).json({
                    error: 'Invalid TXID format',
                    message: 'TXID must be a 64-character hexadecimal string',
                    provided: txid
                });
                return;
            }

            // Check if user identity is provided
            if (!userIdentity) {
                res.status(400).json({
                    error: 'User identity required',
                    message: 'Please provide x-bsv-identity-key header'
                });
                return;
            }

            // Import UsedBsvTransaction model to check for double-spending
            const { UsedBsvTransaction } = await import('../../models/tokens/used-bsv-transaction');

            // Check if TXID has already been used
            const isUsed = await UsedBsvTransaction.isTxidUsed(txid);
            if (isUsed) {
                res.status(409).json({
                    error: 'TXID already used',
                    message: 'This transaction has already been processed. Each TXID can only be used once.',
                    txid
                });
                return;
            }

            Monitor.info(`[Gamification] Manual payment verified. TXID: ${txid.substring(0, 16)}... User: ${userIdentity.substring(0, 16)}...`);

            // For hackathon: Accept the payment (in production, verify on blockchain)
            // We would use BsvService.getTransaction(txid) to verify the transaction exists
            // and check that it paid the correct amount to our address

            // Record the TXID as used to prevent double-spending
            const usedTx = new UsedBsvTransaction({
                id: `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                txid: txid,
                userAddress: userIdentity,
                satoshisReceived: 100, // Amount for hackathon demo
                tokensGranted: 0,      // No tokens, direct service payment
                timestamp: Date.now()
            });
            await usedTx.insert();

            // BSV Direct Payment = Service is paid directly, NO SERVICE_TOKEN given
            // Only grant LOYALTY_TOKEN as reward for using the service
            const loyaltyResult = await this.tokenService.addBalance(userIdentity, 'LOYALTY_TOKEN', reward);
            Monitor.info(`[Gamification] Manual payment: Granted ${reward} LOYALTY_TOKEN as reward. TxID: ${loyaltyResult.txid}`);

            // Get final balances
            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'LOYALTY_TOKEN');

            // Success response
            res.json({
                success: true,
                paymentMethod: 'manual',
                serviceId,
                serviceName,
                bsvTxid: txid,
                loyaltyEarned: reward,
                message: `✅ ${serviceName} pagado con BSV. ¡Has ganado ${reward} puntos de fidelidad!`,
                balances: {
                    serviceToken: serviceTokenBalance,
                    loyaltyToken: loyaltyTokenBalance
                },
                txIds: {
                    bsvPayment: txid,
                    loyalty: loyaltyResult.txid || null
                }
            });

        } catch (e: any) {
            Monitor.error(`[Gamification] Error in processManualPayment: ${e.message}`);
            res.status(500).json({ error: e.message });
        }
    }

    // Redeem Loyalty Points - Get FREE parking directly (no intermediate tokens)
    // POST /api/v1/gamification/redeem-loyalty
    // Rule: 100 LOYALTY_TOKEN = 1 FREE PARKING (direct service, not tokens)
    private async redeemLoyaltyPoints(req: Express.Request, res: Express.Response) {
        try {
            const userIdentity = req.headers['x-bsv-identity-key'] as string;

            if (!userIdentity) {
                res.status(400).json({ 
                    error: 'User identity required',
                    message: 'Please provide x-bsv-identity-key header' 
                });
                return;
            }

            // Redemption configuration
            const LOYALTY_COST = 100;      // Points needed for free parking

            Monitor.info(`[Gamification] Processing loyalty redemption for user: ${userIdentity.substring(0, 16)}...`);

            // Check current LOYALTY_TOKEN balance
            const currentLoyaltyBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'LOYALTY_TOKEN');
            
            if (currentLoyaltyBalance < LOYALTY_COST) {
                res.status(402).json({
                    error: 'Insufficient loyalty points',
                    required: LOYALTY_COST,
                    available: currentLoyaltyBalance,
                    needed: LOYALTY_COST - currentLoyaltyBalance,
                    message: `You need ${LOYALTY_COST} loyalty points but only have ${currentLoyaltyBalance}. Keep using services to earn more!`
                });
                return;
            }

            // BURN LOYALTY_TOKEN to get FREE PARKING (direct service)
            const burnResult = await this.tokenService.burnBalance(userIdentity, 'LOYALTY_TOKEN', LOYALTY_COST);
            Monitor.info(`[Gamification] BURN successful: ${LOYALTY_COST} LOYALTY_TOKEN. TxID: ${burnResult.txid}`);

            // Record the FREE PARKING event on BSV for transparency
            const bsvService = BsvService.getInstance();
            await bsvService.ready();
            const redeemTxid = await bsvService.writeOpReturn({
                event: 'FREE_PARKING_REDEEMED',
                token: 'LOYALTY_TOKEN',
                amount: LOYALTY_COST,
                user: userIdentity.substring(0, 16) + '...',
                timestamp: Date.now()
            });
            Monitor.info(`[Gamification] FREE_PARKING event recorded on BSV. TxID: ${redeemTxid}`);

            // Get final balances
            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'LOYALTY_TOKEN');

            // Calculate how many more redemptions are possible
            const redemptionsAvailable = Math.floor(loyaltyTokenBalance / LOYALTY_COST);

            res.json({
                success: true,
                message: '🎉 ¡Felicidades! Has canjeado tus puntos por un parking GRATIS.',
                redemption: {
                    loyaltySpent: LOYALTY_COST,
                    serviceObtained: 'Parking Familia - 1 reserva GRATIS',
                    freeReservationsEarned: 1
                },
                balances: {
                    serviceToken: serviceTokenBalance,
                    loyaltyToken: loyaltyTokenBalance
                },
                nextRedemption: {
                    pointsNeeded: LOYALTY_COST,
                    currentPoints: loyaltyTokenBalance,
                    canRedeemAgain: loyaltyTokenBalance >= LOYALTY_COST,
                    redemptionsAvailable
                },
                txIds: {
                    burn: burnResult.txid || null,
                    redeem: redeemTxid || null
                }
            });

        } catch (e: any) {
            Monitor.error(`[Gamification] Error in redeemLoyaltyPoints: ${e.message}`);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Get gamification status for a specific user
     * @route GET /api/v1/gamification/status/:userId
     */
    private async getStatus(req: Express.Request, res: Express.Response) {
        try {
            const { userId } = req.params;

            if (!userId) {
                res.status(400).json({ error: 'User ID required' });
                return;
            }

            // Get all token balances
            const legacyBalances = await this.tokenService.getEconomyBalances(userId);
            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(userId, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(userId, 'LOYALTY_TOKEN');

            // Check which services user can afford
            const availableServices = Object.entries(this.SERVICE_CONFIGS)
                .filter(([_, config]) => serviceTokenBalance >= config.cost)
                .map(([id, config]) => ({ id, name: config.name, cost: config.cost, reward: config.reward }));

            // Redemption info
            const LOYALTY_REDEMPTION_COST = 100;
            const SERVICE_REDEMPTION_REWARD = 50;
            const canRedeemLoyalty = loyaltyTokenBalance >= LOYALTY_REDEMPTION_COST;
            const redemptionsAvailable = Math.floor(loyaltyTokenBalance / LOYALTY_REDEMPTION_COST);

            res.json({
                userId,
                balances: {
                    // New loyalty tokens
                    serviceToken: serviceTokenBalance,
                    loyaltyToken: loyaltyTokenBalance,
                    // Legacy tokens (for backward compatibility)
                    service: legacyBalances.service,
                    game: legacyBalances.game
                },
                loyalty: {
                    availableServices,
                    canUseParking: serviceTokenBalance >= 50
                },
                // NEW: Redemption info
                redemption: {
                    loyaltyCost: LOYALTY_REDEMPTION_COST,
                    serviceReward: SERVICE_REDEMPTION_REWARD,
                    canRedeem: canRedeemLoyalty,
                    redemptionsAvailable,
                    pointsUntilNextRedemption: canRedeemLoyalty ? 0 : LOYALTY_REDEMPTION_COST - loyaltyTokenBalance
                },
                gamification: {
                    serviceCostPerAction: this.SERVICE_COST,
                    gameRewardPerAction: this.GAME_REWARD,
                    canAdvance: legacyBalances.service >= this.SERVICE_COST,
                    actionsAvailable: Math.floor(legacyBalances.service / this.SERVICE_COST)
                }
            });
        } catch (e: any) {
            Monitor.error(`[Gamification] Error in getStatus: ${e.message}`);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Get gamification status for current user (from header)
     * @route GET /api/v1/gamification/status
     */
    private async getMyStatus(req: Express.Request, res: Express.Response) {
        try {
            const userId = req.headers['x-bsv-identity-key'] as string;

            if (!userId) {
                res.status(400).json({ error: 'Missing x-bsv-identity-key header' });
                return;
            }

            // Get all token balances
            const legacyBalances = await this.tokenService.getEconomyBalances(userId);
            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(userId, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(userId, 'LOYALTY_TOKEN');

            // Check which services user can afford
            const availableServices = Object.entries(this.SERVICE_CONFIGS)
                .filter(([_, config]) => serviceTokenBalance >= config.cost)
                .map(([id, config]) => ({ id, name: config.name, cost: config.cost, reward: config.reward }));

            // Redemption info
            const LOYALTY_REDEMPTION_COST = 100;
            const SERVICE_REDEMPTION_REWARD = 50;
            const canRedeemLoyalty = loyaltyTokenBalance >= LOYALTY_REDEMPTION_COST;
            const redemptionsAvailable = Math.floor(loyaltyTokenBalance / LOYALTY_REDEMPTION_COST);

            res.json({
                userId,
                balances: {
                    // New loyalty tokens
                    serviceToken: serviceTokenBalance,
                    loyaltyToken: loyaltyTokenBalance,
                    // Legacy tokens (for backward compatibility)
                    service: legacyBalances.service,
                    game: legacyBalances.game
                },
                loyalty: {
                    availableServices,
                    canUseParking: serviceTokenBalance >= 50
                },
                // NEW: Redemption info
                redemption: {
                    loyaltyCost: LOYALTY_REDEMPTION_COST,
                    serviceReward: SERVICE_REDEMPTION_REWARD,
                    canRedeem: canRedeemLoyalty,
                    redemptionsAvailable,
                    pointsUntilNextRedemption: canRedeemLoyalty ? 0 : LOYALTY_REDEMPTION_COST - loyaltyTokenBalance
                },
                gamification: {
                    serviceCostPerAction: this.SERVICE_COST,
                    gameRewardPerAction: this.GAME_REWARD,
                    canAdvance: legacyBalances.service >= this.SERVICE_COST,
                    actionsAvailable: Math.floor(legacyBalances.service / this.SERVICE_COST)
                }
            });
        } catch (e: any) {
            Monitor.error(`[Gamification] Error in getMyStatus: ${e.message}`);
            res.status(500).json({ error: e.message });
        }
    }
}

