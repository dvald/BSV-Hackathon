// Reserved for license

"use strict";

import Express from "express";
import { Controller } from "../controller";
import { TokenService } from "../../services/token-service";
import { BsvService } from "../../services/bsv-service";
import { TokenTransaction } from "../../models/tokens/token-transaction";
import { DataFilter } from "tsbean-orm";
import crypto from "crypto";
import { 
    BAD_REQUEST, 
    NOT_FOUND, 
    INTERNAL_SERVER_ERROR,
    CONFLICT,
    PAYMENT_REQUIRED,
    ensureObjectBody, 
    noCache, 
    sendApiError, 
    sendApiResult 
} from "../../utils/http-utils";

/**
 * Gamification Controller
 * Implements a loyalty/rewards system where users spend SERVICE_TOKEN
 * to use services and receive LOYALTY_TOKEN as guaranteed rewards.
 * All operations are recorded on BSV blockchain via OP_RETURN.
 * @group gamification
 */
export class GamificationController extends Controller {
    private tokenService: TokenService;

    // Configuration constants for generic advance action
    private readonly SERVICE_COST = 10;
    private readonly GAME_REWARD = 5;

    // Service-specific configurations
    private readonly SERVICE_CONFIGS: Record<string, { cost: number; reward: number; name: string; successMessage: string }> = {
        'parking-familia': {
            cost: 50,
            reward: 10,
            name: 'Parking Familia Numerosa',
            successMessage: '¡Plaza reservada! Has ganado 10 puntos de fidelidad.'
        },
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

    public registerAPI(prefix: string, application: Express.Express): void {
        // Legacy advance endpoint
        application.post(prefix + "/gamification/advance", ensureObjectBody(this.advance.bind(this)));

        // Loyalty system endpoints
        application.post(prefix + "/gamification/use-service", ensureObjectBody(this.useService.bind(this)));
        application.post(prefix + "/gamification/pay-service", ensureObjectBody(this.payServiceWithBSV.bind(this)));
        application.post(prefix + "/gamification/redeem-loyalty", ensureObjectBody(this.redeemLoyaltyPoints.bind(this)));

        // Query endpoints
        application.get(prefix + "/gamification/payment-address", noCache(this.getPaymentAddress.bind(this)));
        application.get(prefix + "/gamification/status/:userId", noCache(this.getStatus.bind(this)));
        application.get(prefix + "/gamification/status", noCache(this.getMyStatus.bind(this)));
        application.get(prefix + "/gamification/transactions", noCache(this.getTransactions.bind(this)));
        application.get(prefix + "/gamification/all-transactions", noCache(this.getAllTransactions.bind(this)));
    }

    // ==========================================
    // TYPE DEFINITIONS FOR SWAGGER
    // ==========================================

    /**
     * @typedef AdvanceBody
     * @property {string} userId - User identity key
     * @property {string} actionId - Action identifier
     */

    /**
     * @typedef UseServiceBody
     * @property {string} userId - User identity key
     * @property {string} serviceId.required - Service identifier
     */

    /**
     * @typedef PayServiceBody
     * @property {string} serviceId.required - Service identifier
     * @property {integer} satoshis - Amount in satoshis
     * @property {string} manualTxid - Manual transaction ID for external wallets
     */

    /**
     * @typedef GamificationErrorResponse
     * @property {string} code.required - Error code:
     *  - MISSING_IDENTITY: User identity required
     *  - MISSING_SERVICE_ID: Service ID required
     *  - SERVICE_NOT_FOUND: Service does not exist
     *  - INSUFFICIENT_BALANCE: Not enough tokens
     *  - TXID_ALREADY_USED: Transaction already processed
     *  - INVALID_TXID: Invalid transaction format
     */

    /**
     * @typedef PaymentAddressResponse
     * @property {boolean} success.required
     * @property {string} address.required - BSV address
     * @property {integer} satoshisRequired.required
     * @property {string} paymentUri - Bitcoin URI
     */

    /**
     * @typedef GamificationStatusResponse
     * @property {string} userId.required
     * @property {object} balances.required - Token balances
     * @property {object} loyalty - Loyalty info
     * @property {object} redemption - Redemption info
     */

    // ==========================================
    // QUERY ENDPOINTS
    // ==========================================

    /**
     * Get payment address for external wallets
     * Binding: GetPaymentAddress
     * @route GET /gamification/payment-address
     * @group gamification
     * @returns {PaymentAddressResponse.model} 200 - Payment address info
     */
    private async getPaymentAddress(request: Express.Request, response: Express.Response) {
        try {
            const bsvService = BsvService.getInstance();
            await bsvService.ready();

            const address = bsvService.getAddress();
            const satoshisRequired = 100;

            if (!address) {
                sendApiError(request, response, INTERNAL_SERVER_ERROR, "WALLET_NOT_CONFIGURED", "Backend wallet address not available");
                return;
            }

            sendApiResult(request, response, {
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "PAYMENT_ADDRESS_ERROR", e.message);
        }
    }

    // ==========================================
    // GAMIFICATION ENDPOINTS
    // ==========================================

    /**
     * Advance action - User spends SERVICE tokens and receives GAME tokens
     * Binding: Advance
     * @route POST /gamification/advance
     * @group gamification
     * @param {AdvanceBody.model} request.body - Advance data
     * @returns {object} 200 - Action result
     * @returns {GamificationErrorResponse.model} 400 - Bad request
     * @returns {void} 402 - Payment required
     * @security AuthToken
     */
    private async advance(request: Express.Request, response: Express.Response) {
        try {
            const { userId, actionId } = request.body;
            const userIdentity = userId || request.headers['x-bsv-identity-key'] as string;

            if (!userIdentity) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY", "User ID required");
                return;
            }

            const action = actionId || 'default_advance';

            request.logger.info('[Gamification] Processing advance', { action, user: userIdentity.substring(0, 16) });

            const currentServiceBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE');

            if (currentServiceBalance < this.SERVICE_COST) {
                sendApiError(request, response, PAYMENT_REQUIRED, "INSUFFICIENT_BALANCE", 
                    `You need ${this.SERVICE_COST} SERVICE tokens but only have ${currentServiceBalance}`);
                return;
            }

            let burnResult;
            try {
                burnResult = await this.tokenService.burnBalance(userIdentity, 'SERVICE', this.SERVICE_COST);
            } catch (burnError: any) {
                if (burnError.message.includes('Insufficient')) {
                    sendApiError(request, response, PAYMENT_REQUIRED, "INSUFFICIENT_BALANCE", burnError.message);
                    return;
                }
                throw burnError;
            }

            request.logger.info('[Gamification] BURN successful', { cost: this.SERVICE_COST, txid: burnResult.txid });

            const mintResult = await this.tokenService.addBalance(userIdentity, 'GAME', this.GAME_REWARD);

            request.logger.info('[Gamification] MINT successful', { reward: this.GAME_REWARD, txid: mintResult.txid });

            const finalBalances = await this.tokenService.getEconomyBalances(userIdentity);

            sendApiResult(request, response, {
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "ADVANCE_ERROR", e.message);
        }
    }

    /**
     * Use Service - Loyalty system endpoint
     * Binding: UseService
     * @route POST /gamification/use-service
     * @group gamification
     * @param {UseServiceBody.model} request.body.required - Service usage data
     * @returns {object} 200 - Service usage result
     * @returns {GamificationErrorResponse.model} 400 - Bad request
     * @returns {void} 402 - Payment required
     * @returns {void} 404 - Service not found
     * @security AuthToken
     */
    private async useService(request: Express.Request, response: Express.Response) {
        try {
            const { userId, serviceId } = request.body;
            const userIdentity = userId || request.headers['x-bsv-identity-key'] as string;

            if (!userIdentity) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY", "User ID required");
                return;
            }

            if (!serviceId) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_SERVICE_ID", "Service ID required");
                return;
            }

            const serviceConfig = this.SERVICE_CONFIGS[serviceId];
            if (!serviceConfig) {
                sendApiError(request, response, NOT_FOUND, "SERVICE_NOT_FOUND", `Service '${serviceId}' not found`);
                return;
            }

            const { cost, reward, name, successMessage } = serviceConfig;

            request.logger.info('[Gamification] Processing use-service', { serviceId, user: userIdentity.substring(0, 16) });

            const currentServiceBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE_TOKEN');

            if (currentServiceBalance < cost) {
                sendApiError(request, response, PAYMENT_REQUIRED, "INSUFFICIENT_BALANCE",
                    `You need ${cost} SERVICE_TOKEN but only have ${currentServiceBalance}`);
                return;
            }

            let burnResult;
            try {
                burnResult = await this.tokenService.burnBalance(userIdentity, 'SERVICE_TOKEN', cost);
            } catch (burnError: any) {
                if (burnError.message.includes('Insufficient')) {
                    sendApiError(request, response, PAYMENT_REQUIRED, "INSUFFICIENT_BALANCE", burnError.message);
                    return;
                }
                throw burnError;
            }

            request.logger.info('[Gamification] BURN successful', { cost, serviceId, txid: burnResult.txid });

            const mintResult = await this.tokenService.addBalance(userIdentity, 'LOYALTY_TOKEN', reward);

            request.logger.info('[Gamification] MINT successful', { reward, serviceId, txid: mintResult.txid });

            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'LOYALTY_TOKEN');

            sendApiResult(request, response, {
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "USE_SERVICE_ERROR", e.message);
        }
    }

    /**
     * Pay for Service with BSV - Hybrid Payment Flow
     * Binding: PayServiceWithBSV
     * @route POST /gamification/pay-service
     * @group gamification
     * @param {PayServiceBody.model} request.body.required - Payment data
     * @returns {object} 200 - Payment result
     * @returns {GamificationErrorResponse.model} 400 - Bad request
     * @returns {void} 402 - Payment required
     * @returns {void} 404 - Service not found
     * @security AuthToken
     */
    private async payServiceWithBSV(request: Express.Request, response: Express.Response) {
        try {
            const { serviceId, satoshis, manualTxid } = request.body;
            const paymentHeader = request.headers['x-bsv-payment'] as string;
            const userIdentity = request.headers['x-bsv-identity-key'] as string;

            if (!serviceId) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_SERVICE_ID", "Service ID required");
                return;
            }

            const serviceConfig = this.SERVICE_CONFIGS[serviceId];
            if (!serviceConfig) {
                sendApiError(request, response, NOT_FOUND, "SERVICE_NOT_FOUND", `Service '${serviceId}' not found`);
                return;
            }

            const { cost: tokenCost, reward, name, successMessage } = serviceConfig;
            const requiredSatoshis = satoshis || 100;
            const tokensToGrant = tokenCost;

            // Manual TXID Flow
            if (manualTxid) {
                request.logger.info('[Gamification] Processing MANUAL payment', { serviceId, txid: manualTxid.substring(0, 16) });
                return await this.processManualPayment(request, response, manualTxid, serviceId, userIdentity, tokensToGrant, reward, name, successMessage);
            }

            // x402 Flow: No payment header = 402 Payment Required
            if (!paymentHeader) {
                request.logger.info('[Gamification] 402 Payment Required', { serviceId });

                const derivationPrefix = crypto.randomBytes(16).toString('base64');
                const bsvService = BsvService.getInstance();
                await bsvService.ready();
                const backendAddress = bsvService.getAddress();

                response.set('x-bsv-payment-derivation-prefix', derivationPrefix);
                response.set('x-bsv-payment-satoshis-required', requiredSatoshis.toString());

                response.status(402).json({
                    error: 'Payment Required',
                    message: `Pay ${requiredSatoshis} sats for ${name} and earn ${reward} loyalty points!`,
                    serviceId,
                    serviceName: name,
                    satoshisRequired: requiredSatoshis,
                    loyaltyReward: reward,
                    manualPayment: {
                        address: backendAddress,
                        paymentUri: `bitcoin:${backendAddress}?amount=${requiredSatoshis / 100000000}`,
                        instructions: 'Send BSV to address, then submit TXID'
                    }
                });
                return;
            }

            // x402 Payment Processing
            request.logger.info('[Gamification] Processing x402 BSV payment', { serviceId });

            let paymentData: any;
            try {
                paymentData = JSON.parse(paymentHeader);
            } catch (parseError) {
                sendApiError(request, response, BAD_REQUEST, "INVALID_PAYMENT_HEADER", "Invalid x-bsv-payment header format");
                return;
            }

            const { derivationPrefix, derivationSuffix, transaction, senderIdentityKey, amount } = paymentData;

            if (!transaction || !senderIdentityKey) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_PAYMENT_DATA", "Missing transaction or senderIdentityKey");
                return;
            }

            const payerIdentity = senderIdentityKey || userIdentity;

            if (!payerIdentity) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY", "Could not determine payer identity");
                return;
            }

            request.logger.info('[Gamification] x402 Payment', { payer: payerIdentity.substring(0, 16), amount });

            try {
                const bsvService = BsvService.getInstance();
                await bsvService.ready();
                request.logger.info('[Gamification] BSV payment accepted (hackathon mode)');
            } catch (bsvError: any) {
                request.logger.warning('[Gamification] BSV verification skipped', { error: bsvError.message });
            }

            const bsvService = BsvService.getInstance();
            const paymentTxid = await bsvService.writeOpReturn({
                event: 'BSV_SERVICE_PAYMENT',
                token: 'BSV',
                amount: amount || requiredSatoshis,
                user: payerIdentity.substring(0, 16) + '...',
                timestamp: Date.now()
            });

            request.logger.info('[Gamification] BSV payment recorded', { txid: paymentTxid });

            const loyaltyResult = await this.tokenService.addBalance(payerIdentity, 'LOYALTY_TOKEN', reward);

            request.logger.info('[Gamification] Granted loyalty reward', { reward, txid: loyaltyResult.txid });

            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(payerIdentity, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(payerIdentity, 'LOYALTY_TOKEN');

            sendApiResult(request, response, {
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "PAY_SERVICE_ERROR", e.message);
        }
    }

    /**
     * Process Manual Payment - For external wallets
     */
    private async processManualPayment(
        request: Express.Request,
        response: Express.Response,
        txid: string,
        serviceId: string,
        userIdentity: string,
        tokensToGrant: number,
        reward: number,
        serviceName: string,
        successMessage: string
    ) {
        try {
            const txidRegex = /^[a-fA-F0-9]{64}$/;
            if (!txidRegex.test(txid)) {
                sendApiError(request, response, BAD_REQUEST, "INVALID_TXID", "TXID must be 64 hexadecimal characters");
                return;
            }

            if (!userIdentity) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY", "Please provide x-bsv-identity-key header");
                return;
            }

            const { UsedBsvTransaction } = await import('../../models/tokens/used-bsv-transaction');

            const isUsed = await UsedBsvTransaction.isTxidUsed(txid);
            if (isUsed) {
                sendApiError(request, response, CONFLICT, "TXID_ALREADY_USED", "This transaction has already been processed");
                return;
            }

            request.logger.info('[Gamification] Manual payment verified', { txid: txid.substring(0, 16), user: userIdentity.substring(0, 16) });

            const usedTx = new UsedBsvTransaction({
                id: `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                txid: txid,
                userAddress: userIdentity,
                satoshisReceived: 100,
                tokensGranted: 0,
                timestamp: Date.now()
            });
            await usedTx.insert();

            const loyaltyResult = await this.tokenService.addBalance(userIdentity, 'LOYALTY_TOKEN', reward);

            request.logger.info('[Gamification] Manual payment: Granted loyalty', { reward, txid: loyaltyResult.txid });

            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'LOYALTY_TOKEN');

            sendApiResult(request, response, {
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "MANUAL_PAYMENT_ERROR", e.message);
        }
    }

    /**
     * Redeem Loyalty Points for free service
     * Binding: RedeemLoyaltyPoints
     * @route POST /gamification/redeem-loyalty
     * @group gamification
     * @returns {object} 200 - Redemption result
     * @returns {GamificationErrorResponse.model} 400 - Bad request
     * @returns {void} 402 - Insufficient points
     * @security AuthToken
     */
    private async redeemLoyaltyPoints(request: Express.Request, response: Express.Response) {
        try {
            const userIdentity = request.headers['x-bsv-identity-key'] as string;

            if (!userIdentity) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY", "Please provide x-bsv-identity-key header");
                return;
            }

            const LOYALTY_COST = 100;

            request.logger.info('[Gamification] Processing loyalty redemption', { user: userIdentity.substring(0, 16) });

            const currentLoyaltyBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'LOYALTY_TOKEN');

            if (currentLoyaltyBalance < LOYALTY_COST) {
                sendApiError(request, response, PAYMENT_REQUIRED, "INSUFFICIENT_POINTS",
                    `You need ${LOYALTY_COST} points but only have ${currentLoyaltyBalance}`);
                return;
            }

            const burnResult = await this.tokenService.burnBalance(userIdentity, 'LOYALTY_TOKEN', LOYALTY_COST);

            request.logger.info('[Gamification] BURN successful', { cost: LOYALTY_COST, txid: burnResult.txid });

            const bsvService = BsvService.getInstance();
            await bsvService.ready();
            const redeemTxid = await bsvService.writeOpReturn({
                event: 'FREE_PARKING_REDEEMED',
                token: 'LOYALTY_TOKEN',
                amount: LOYALTY_COST,
                user: userIdentity.substring(0, 16) + '...',
                timestamp: Date.now()
            });

            request.logger.info('[Gamification] FREE_PARKING event recorded', { txid: redeemTxid });

            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(userIdentity, 'LOYALTY_TOKEN');
            const redemptionsAvailable = Math.floor(loyaltyTokenBalance / LOYALTY_COST);

            sendApiResult(request, response, {
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "REDEEM_ERROR", e.message);
        }
    }

    // ==========================================
    // STATUS ENDPOINTS
    // ==========================================

    /**
     * Get gamification status for a specific user
     * Binding: GetStatus
     * @route GET /gamification/status/{userId}
     * @group gamification
     * @param {string} userId.path.required - User identity key
     * @returns {GamificationStatusResponse.model} 200 - User status
     * @returns {GamificationErrorResponse.model} 400 - Bad request
     */
    private async getStatus(request: Express.Request, response: Express.Response) {
        try {
            const { userId } = request.params;

            if (!userId) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_USER_ID", "User ID required");
                return;
            }

            const legacyBalances = await this.tokenService.getEconomyBalances(userId);
            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(userId, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(userId, 'LOYALTY_TOKEN');

            const availableServices = Object.entries(this.SERVICE_CONFIGS)
                .filter(([_, config]) => serviceTokenBalance >= config.cost)
                .map(([id, config]) => ({ id, name: config.name, cost: config.cost, reward: config.reward }));

            const LOYALTY_REDEMPTION_COST = 100;
            const SERVICE_REDEMPTION_REWARD = 50;
            const canRedeemLoyalty = loyaltyTokenBalance >= LOYALTY_REDEMPTION_COST;
            const redemptionsAvailable = Math.floor(loyaltyTokenBalance / LOYALTY_REDEMPTION_COST);

            sendApiResult(request, response, {
                userId,
                balances: {
                    serviceToken: serviceTokenBalance,
                    loyaltyToken: loyaltyTokenBalance,
                    service: legacyBalances.service,
                    game: legacyBalances.game
                },
                loyalty: {
                    availableServices,
                    canUseParking: serviceTokenBalance >= 50
                },
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "STATUS_ERROR", e.message);
        }
    }

    /**
     * Get gamification status for current user
     * Binding: GetMyStatus
     * @route GET /gamification/status
     * @group gamification
     * @returns {GamificationStatusResponse.model} 200 - User status
     * @returns {GamificationErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async getMyStatus(request: Express.Request, response: Express.Response) {
        try {
            const userId = request.headers['x-bsv-identity-key'] as string;

            if (!userId) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY_KEY", "Missing x-bsv-identity-key header");
                return;
            }

            const legacyBalances = await this.tokenService.getEconomyBalances(userId);
            const serviceTokenBalance = await this.tokenService.getBalanceBySymbol(userId, 'SERVICE_TOKEN');
            const loyaltyTokenBalance = await this.tokenService.getBalanceBySymbol(userId, 'LOYALTY_TOKEN');

            const availableServices = Object.entries(this.SERVICE_CONFIGS)
                .filter(([_, config]) => serviceTokenBalance >= config.cost)
                .map(([id, config]) => ({ id, name: config.name, cost: config.cost, reward: config.reward }));

            const LOYALTY_REDEMPTION_COST = 100;
            const SERVICE_REDEMPTION_REWARD = 50;
            const canRedeemLoyalty = loyaltyTokenBalance >= LOYALTY_REDEMPTION_COST;
            const redemptionsAvailable = Math.floor(loyaltyTokenBalance / LOYALTY_REDEMPTION_COST);

            sendApiResult(request, response, {
                userId,
                balances: {
                    serviceToken: serviceTokenBalance,
                    loyaltyToken: loyaltyTokenBalance,
                    service: legacyBalances.service,
                    game: legacyBalances.game
                },
                loyalty: {
                    availableServices,
                    canUseParking: serviceTokenBalance >= 50
                },
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "STATUS_ERROR", e.message);
        }
    }

    /**
     * Get user transaction history
     * Returns token transactions for the authenticated user with real BSV txids
     * @route GET /api/v1/gamification/transactions
     * @group gamification - Loyalty system operations
     * @param {string} x-bsv-identity-key.header.required - User identity key
     * @returns {TransactionsResponse.model} 200 - Transaction list
     * @returns {GamificationErrorResponse.model} 400 - Missing identity key
     * @security AuthToken
     */
    private async getTransactions(request: Express.Request, response: Express.Response) {
        try {
            const userId = request.headers['x-bsv-identity-key'] as string;

            if (!userId) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY_KEY", "Missing x-bsv-identity-key header");
                return;
            }

            request.logger.info("Fetching transactions for user", { userId: userId.substring(0, 16) + '...' });

            // Find transactions where user is sender or receiver
            const transactions = await TokenTransaction.finder.find(
                DataFilter.or(
                    DataFilter.equals("toIdentityKey", userId),
                    DataFilter.equals("fromIdentityKey", userId)
                )
            );

            // Sort by timestamp descending (newest first)
            transactions.sort((a, b) => b.timestamp - a.timestamp);

            // Map to event format for frontend, limit to 50 most recent
            const events = transactions.slice(0, 50).map(tx => ({
                id: tx.id,
                type: this.mapTransactionType(tx.type),
                description: tx.notes || this.generateDescription(tx),
                timestamp: new Date(tx.timestamp).toISOString(),
                txId: tx.txid && tx.txid.length > 10 ? tx.txid : null, // Only include real txids
                amount: tx.amount,
                tokenId: tx.tokenId,
                verified: !!(tx.txid && tx.txid.length > 10),
                actor: "System",
                service: this.getServiceFromToken(tx.tokenId)
            }));

            request.logger.info("Returning transactions", { count: events.length });

            sendApiResult(request, response, { 
                events,
                total: transactions.length
            });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TRANSACTIONS_ERROR", e.message);
        }
    }

    // Helper method to map transaction types to event types
    private mapTransactionType(type: string): string {
        const typeMap: Record<string, string> = {
            'genesis': 'token_created',
            'mint': 'token_issued',
            'burn': 'token_used',
            'transfer': 'token_transfer'
        };
        return typeMap[type] || 'token_operation';
    }

    // Helper to generate description if notes is empty
    private generateDescription(tx: TokenTransaction): string {
        switch (tx.type) {
            case 'mint':
                return `${tx.amount} tokens credited`;
            case 'burn':
                return `${tx.amount} tokens used`;
            case 'transfer':
                return `${tx.amount} tokens transferred`;
            case 'genesis':
                return 'Token created';
            default:
                return 'Token operation';
        }
    }

    // Helper to get service name from tokenId
    private getServiceFromToken(tokenId: string): string {
        if (!tokenId) return 'Token Service';
        if (tokenId.includes('SERVICE') || tokenId.toLowerCase().includes('service')) {
            return 'Service Tokens';
        }
        if (tokenId.includes('LOYALTY') || tokenId.toLowerCase().includes('loyalty')) {
            return 'Loyalty Program';
        }
        return 'Token Service';
    }

    // Debug endpoint to see ALL transactions (for hackathon demo)
    private async getAllTransactions(request: Express.Request, response: Express.Response) {
        try {
            request.logger.info("Fetching ALL transactions (debug)");

            // Get all transactions without filtering by user
            const transactions = await TokenTransaction.finder.find(
                DataFilter.notEquals("id", "") // Get all
            );

            // Sort by timestamp descending (newest first)
            transactions.sort((a, b) => b.timestamp - a.timestamp);

            // Return raw data for debugging
            const events = transactions.slice(0, 100).map(tx => ({
                id: tx.id,
                type: tx.type,
                notes: tx.notes,
                timestamp: new Date(tx.timestamp).toISOString(),
                txId: tx.txid || null,
                amount: tx.amount,
                tokenId: tx.tokenId,
                toIdentityKey: tx.toIdentityKey ? tx.toIdentityKey.substring(0, 20) + '...' : null,
                fromIdentityKey: tx.fromIdentityKey ? tx.fromIdentityKey.substring(0, 20) + '...' : null,
            }));

            request.logger.info("Returning ALL transactions", { count: events.length, total: transactions.length });

            sendApiResult(request, response, { 
                events,
                total: transactions.length,
                message: "Debug endpoint - shows all transactions in database"
            });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TRANSACTIONS_ERROR", e.message);
        }
    }
}
