// Reserved for license

"use strict";

import Express from "express";
import { Controller } from "../controller";
import { TokenService } from "../../services/token-service";
import { Token } from "../../models/tokens/token";
import { UsedBsvTransaction } from "../../models/tokens/used-bsv-transaction";
import { DataFilter } from "tsbean-orm";
import { BsvService } from "../../services/bsv-service";
import { createRandomUID } from "../../utils/text-utils";
import { 
    BAD_REQUEST, 
    NOT_FOUND, 
    INTERNAL_SERVER_ERROR,
    CONFLICT,
    PAYMENT_REQUIRED,
    ensureObjectBody, 
    noCache, 
    sendApiError, 
    sendApiResult, 
    sendApiSuccess 
} from "../../utils/http-utils";

/**
 * Token API Controller
 * Manages token creation, minting, transfers, and economy operations
 * @group tokens
 */
export class TokenController extends Controller {
    private tokenService: TokenService;

    constructor() {
        super();
        this.tokenService = TokenService.getInstance();
    }

    public registerAPI(prefix: string, application: Express.Express): void {
        // Token CRUD
        application.post(prefix + "/tokens/create", ensureObjectBody(this.createToken.bind(this)));
        application.post(prefix + "/tokens/confirm-genesis", ensureObjectBody(this.confirmGenesis.bind(this)));
        application.post(prefix + "/tokens/create-service-token", ensureObjectBody(this.createServiceToken.bind(this)));

        // Minting
        application.post(prefix + "/tokens/:tokenId/mint", ensureObjectBody(this.mintToken.bind(this)));
        application.post(prefix + "/tokens/confirm-mint", ensureObjectBody(this.confirmMint.bind(this)));

        // Transfers
        application.post(prefix + "/tokens/:tokenId/transfer", ensureObjectBody(this.transferToken.bind(this)));
        application.post(prefix + "/tokens/:tokenId/execute-transfer", ensureObjectBody(this.executeTransfer.bind(this)));
        application.post(prefix + "/tokens/confirm-transfer", ensureObjectBody(this.confirmTransfer.bind(this)));

        // Queries
        application.get(prefix + "/tokens/my-tokens", noCache(this.getMyTokens.bind(this)));
        application.get(prefix + "/tokens/my-balances", noCache(this.getMyBalances.bind(this)));
        application.get(prefix + "/tokens/service-tokens", noCache(this.getServiceTokens.bind(this)));
        application.get(prefix + "/tokens/all", noCache(this.getAllTokens.bind(this)));

        // Economy endpoints
        application.post(prefix + "/tokens/economy/init", ensureObjectBody(this.initEconomyTokens.bind(this)));
        application.post(prefix + "/tokens/economy/purchase", ensureObjectBody(this.purchaseServiceToken.bind(this)));
        application.post(prefix + "/tokens/economy/play", ensureObjectBody(this.playGame.bind(this)));
        application.post(prefix + "/tokens/economy/buy-credits", ensureObjectBody(this.buyCredits.bind(this)));
        application.post(prefix + "/tokens/economy/buy-credits-x402", ensureObjectBody(this.buyCreditsX402.bind(this)));
        application.get(prefix + "/tokens/economy/balance/:userId", noCache(this.getEconomyBalance.bind(this)));
        application.get(prefix + "/tokens/economy/balance", noCache(this.getMyEconomyBalance.bind(this)));

        // BSV Purchase
        application.post(prefix + "/tokens/buy-with-bsv", ensureObjectBody(this.buyWithBsv.bind(this)));

        // Single token query (must be last due to :tokenId param)
        application.get(prefix + "/tokens/:tokenId", noCache(this.getToken.bind(this)));
    }

    // ==========================================
    // TYPE DEFINITIONS FOR SWAGGER
    // ==========================================

    /**
     * @typedef CreateTokenBody
     * @property {string} name.required - Token name
     * @property {string} symbol.required - Token symbol (e.g., "SVC")
     * @property {integer} decimals - Decimal places (default: 2)
     * @property {integer} maxSupply - Maximum supply (0 = unlimited)
     * @property {object} metadata - Additional metadata
     */

    /**
     * @typedef TokenResponse
     * @property {string} tokenId.required - Token ID
     * @property {string} name.required - Token name
     * @property {string} symbol.required - Token symbol
     * @property {integer} decimals - Decimal places
     * @property {integer} maxSupply - Maximum supply
     */

    /**
     * @typedef TokenErrorResponse
     * @property {string} code.required - Error code:
     *  - MISSING_IDENTITY_KEY: Identity key header required
     *  - MISSING_FIELDS: Required fields missing
     *  - TOKEN_NOT_FOUND: Token does not exist
     *  - TXID_ALREADY_USED: Transaction already processed
     *  - INSUFFICIENT_BALANCE: Not enough tokens
     */

    /**
     * @typedef EconomyBalanceResponse
     * @property {string} userId.required - User identity key
     * @property {object} balances.required - Token balances
     */

    // ==========================================
    // TOKEN CRUD ENDPOINTS
    // ==========================================

    /**
     * Create a new token
     * Binding: CreateToken
     * @route POST /tokens/create
     * @group tokens
     * @param {CreateTokenBody.model} request.body.required - Token data
     * @returns {TokenResponse.model} 200 - Token created
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async createToken(request: Express.Request, response: Express.Response) {
        try {
            const { name, symbol, decimals, maxSupply, metadata } = request.body;
            const creatorIdentityKey = request.headers['x-bsv-identity-key'] as string;

            if (!creatorIdentityKey) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY_KEY", "Missing identity key header");
                return;
            }

            const result = await this.tokenService.createToken(creatorIdentityKey, name, symbol, decimals, maxSupply, metadata);
            const tempTokenId = `temp_${Date.now()}`;

            sendApiResult(request, response, {
                action: result.action,
                tokenId: tempTokenId,
                name,
                symbol,
                decimals,
                maxSupply
            });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TOKEN_ERROR", e.message);
        }
    }

    /**
     * Confirm token genesis transaction
     * Binding: ConfirmGenesis
     * @route POST /tokens/confirm-genesis
     * @group tokens
     * @param {object} request.body.required - Genesis data with txid and vout
     * @returns {TokenResponse.model} 200 - Token confirmed
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async confirmGenesis(request: Express.Request, response: Express.Response) {
        try {
            const { txid, vout, name, symbol, decimals, maxSupply, metadata } = request.body;
            const creatorIdentityKey = request.headers['x-bsv-identity-key'] as string;

            request.logger.info('[confirmGenesis] Saving token', { name, symbol, txid, vout });

            const token = await this.tokenService.confirmGenesis(txid, vout, creatorIdentityKey, name, symbol, decimals, maxSupply, metadata);
            
            request.logger.info('[confirmGenesis] Token saved', { tokenId: token.id });
            sendApiResult(request, response, { tokenId: token.id });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TOKEN_ERROR", e.message);
        }
    }

    /**
     * Create a service token owned by backend
     * Binding: CreateServiceToken
     * @route POST /tokens/create-service-token
     * @group tokens
     * @param {CreateTokenBody.model} request.body.required - Token data
     * @returns {TokenResponse.model} 200 - Service token created
     * @returns {TokenErrorResponse.model} 400 - Bad request
     */
    private async createServiceToken(request: Express.Request, response: Express.Response) {
        try {
            const { name, symbol, decimals, maxSupply, metadata } = request.body;

            if (!name || !symbol) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_FIELDS", "Name and symbol are required");
                return;
            }

            const bsvService = BsvService.getInstance();
            await bsvService.ready();
            const backendIdentityKey = bsvService.getIdentityKey();

            const result = await this.tokenService.createServiceToken(
                name,
                symbol,
                decimals || 2,
                maxSupply || 1000000000,
                metadata || {},
                backendIdentityKey
            );

            request.logger.info('[createServiceToken] Token created', { tokenId: result.tokenId });

            sendApiResult(request, response, {
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TOKEN_ERROR", e.message);
        }
    }

    // ==========================================
    // MINTING ENDPOINTS
    // ==========================================

    /**
     * Prepare mint action for a token
     * Binding: MintToken
     * @route POST /tokens/{tokenId}/mint
     * @group tokens
     * @param {string} tokenId.path.required - Token ID
     * @param {object} request.body.required - Mint data with recipientIdentityKey and amount
     * @returns {object} 200 - Mint action prepared
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async mintToken(request: Express.Request, response: Express.Response) {
        try {
            const { tokenId } = request.params;
            const { recipientIdentityKey, amount } = request.body;
            const creatorIdentityKey = request.headers['x-bsv-identity-key'] as string;

            const result = await this.tokenService.prepareMintAction(tokenId, creatorIdentityKey, recipientIdentityKey, amount);
            sendApiResult(request, response, result);
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "MINT_ERROR", e.message);
        }
    }

    /**
     * Confirm mint transaction
     * Binding: ConfirmMint
     * @route POST /tokens/confirm-mint
     * @group tokens
     * @param {object} request.body.required - Mint confirmation data
     * @returns {void} 200 - Mint confirmed
     * @returns {TokenErrorResponse.model} 400 - Bad request
     */
    private async confirmMint(request: Express.Request, response: Express.Response) {
        try {
            const { tokenId, txid, vout, recipientIdentityKey, amount } = request.body;

            await this.tokenService.confirmMint(tokenId, txid, vout, recipientIdentityKey, amount);
            sendApiSuccess(request, response);
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "MINT_ERROR", e.message);
        }
    }

    // ==========================================
    // TRANSFER ENDPOINTS
    // ==========================================

    /**
     * Prepare transfer action
     * Binding: TransferToken
     * @route POST /tokens/{tokenId}/transfer
     * @group tokens
     * @param {string} tokenId.path.required - Token ID
     * @param {object} request.body.required - Transfer data
     * @returns {object} 200 - Transfer action prepared
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async transferToken(request: Express.Request, response: Express.Response) {
        try {
            const { tokenId } = request.params;
            const { recipientIdentityKey, amount } = request.body;
            const senderIdentityKey = request.headers['x-bsv-identity-key'] as string;

            const result = await this.tokenService.prepareTransferAction(tokenId, senderIdentityKey, recipientIdentityKey, amount);
            sendApiResult(request, response, result);
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TRANSFER_ERROR", e.message);
        }
    }

    /**
     * Execute transfer directly
     * Binding: ExecuteTransfer
     * @route POST /tokens/{tokenId}/execute-transfer
     * @group tokens
     * @param {string} tokenId.path.required - Token ID
     * @param {object} request.body.required - Transfer data
     * @returns {object} 200 - Transfer executed
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async executeTransfer(request: Express.Request, response: Express.Response) {
        try {
            const { tokenId } = request.params;
            const { recipientIdentityKey, amount } = request.body;
            const senderIdentityKey = request.headers['x-bsv-identity-key'] as string;

            if (!senderIdentityKey) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY_KEY", "Missing identity key");
                return;
            }

            const result = await this.tokenService.executeTransfer(tokenId, senderIdentityKey, recipientIdentityKey, amount);
            sendApiResult(request, response, result);
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TRANSFER_ERROR", e.message);
        }
    }

    /**
     * Confirm transfer transaction
     * Binding: ConfirmTransfer
     * @route POST /tokens/confirm-transfer
     * @group tokens
     * @param {object} request.body.required - Transfer confirmation data
     * @returns {void} 200 - Transfer confirmed
     * @returns {TokenErrorResponse.model} 400 - Bad request
     */
    private async confirmTransfer(request: Express.Request, response: Express.Response) {
        try {
            const { tokenId, txid, inputs, outputs } = request.body;
            await this.tokenService.confirmTransfer(tokenId, txid, inputs, outputs);
            sendApiSuccess(request, response);
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TRANSFER_ERROR", e.message);
        }
    }

    // ==========================================
    // QUERY ENDPOINTS
    // ==========================================

    /**
     * Get tokens created by current user
     * Binding: GetMyTokens
     * @route GET /tokens/my-tokens
     * @group tokens
     * @returns {Array.<TokenResponse>} 200 - List of tokens
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async getMyTokens(request: Express.Request, response: Express.Response) {
        try {
            const identityKey = request.headers['x-bsv-identity-key'] as string;
            
            if (!identityKey) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY_KEY", "Missing identity key");
                return;
            }

            const tokens = await this.tokenService.getTokensByCreator(identityKey);
            request.logger.info('[getMyTokens] Found tokens', { count: tokens.length });
            sendApiResult(request, response, tokens);
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TOKEN_ERROR", e.message);
        }
    }

    /**
     * Get token balances for current user
     * Binding: GetMyBalances
     * @route GET /tokens/my-balances
     * @group tokens
     * @returns {Array.<object>} 200 - List of balances
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async getMyBalances(request: Express.Request, response: Express.Response) {
        try {
            const identityKey = request.headers['x-bsv-identity-key'] as string;
            
            if (!identityKey) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY_KEY", "Missing identity key");
                return;
            }

            const tokens = await this.tokenService.getTokensByHolder(identityKey);
            request.logger.info('[getMyBalances] Found tokens', { count: tokens.length });
            sendApiResult(request, response, tokens);
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TOKEN_ERROR", e.message);
        }
    }

    /**
     * Get service tokens created by backend
     * Binding: GetServiceTokens
     * @route GET /tokens/service-tokens
     * @group tokens
     * @returns {Array.<TokenResponse>} 200 - List of service tokens
     */
    private async getServiceTokens(request: Express.Request, response: Express.Response) {
        try {
            const bsvService = BsvService.getInstance();
            await bsvService.ready();
            const backendIdentityKey = bsvService.getIdentityKey();

            const tokens = await this.tokenService.getTokensByCreator(backendIdentityKey);
            request.logger.info('[getServiceTokens] Found service tokens', { count: tokens.length });
            sendApiResult(request, response, tokens);
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TOKEN_ERROR", e.message);
        }
    }

    /**
     * Get all tokens in the system
     * Binding: GetAllTokens
     * @route GET /tokens/all
     * @group tokens
     * @returns {object} 200 - List of all tokens
     */
    private async getAllTokens(request: Express.Request, response: Express.Response) {
        try {
            const tokensRaw = await Token.finder.find(DataFilter.any());
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
            
            sendApiResult(request, response, {
                tokens,
                disclaimer: "This list only includes tokens indexed by this application overlay."
            });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TOKEN_ERROR", e.message);
        }
    }

    /**
     * Get a specific token by ID
     * Binding: GetToken
     * @route GET /tokens/{tokenId}
     * @group tokens
     * @param {string} tokenId.path.required - Token ID
     * @returns {TokenResponse.model} 200 - Token details
     * @returns {void} 404 - Token not found
     */
    private async getToken(request: Express.Request, response: Express.Response) {
        try {
            const { tokenId } = request.params;
            const token = await Token.finder.findByKey(tokenId);
            
            if (!token) {
                sendApiError(request, response, NOT_FOUND, "TOKEN_NOT_FOUND", "Token not found");
                return;
            }
            
            sendApiResult(request, response, token);
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "TOKEN_ERROR", e.message);
        }
    }

    // ==========================================
    // ECONOMY ENDPOINTS
    // ==========================================

    /**
     * Initialize economy tokens (SERVICE, GAME, SERVICE_TOKEN, LOYALTY_TOKEN)
     * Binding: InitEconomyTokens
     * @route POST /tokens/economy/init
     * @group tokens-economy
     * @returns {object} 200 - Economy tokens initialized
     */
    private async initEconomyTokens(request: Express.Request, response: Express.Response) {
        try {
            const bsvService = BsvService.getInstance();
            await bsvService.ready();
            const backendIdentityKey = bsvService.getIdentityKey();

            const results: any[] = [];

            // LEGACY TOKENS
            const serviceToken = await this.tokenService.getTokenBySymbol('SERVICE');
            if (!serviceToken) {
                request.logger.info('[initEconomyTokens] Creating SERVICE token...');
                const serviceResult = await this.tokenService.createServiceToken(
                    'Service Token', 'SERVICE', 0, 0,
                    { description: 'Token de servicio para el hackathon. Se obtiene comprando con BSV.' },
                    backendIdentityKey
                );
                results.push({ token: 'SERVICE', created: true, tokenId: serviceResult.tokenId, txid: serviceResult.txid });
            } else {
                results.push({ token: 'SERVICE', created: false, tokenId: serviceToken.id, message: 'Already exists' });
            }

            const gameToken = await this.tokenService.getTokenBySymbol('GAME');
            if (!gameToken) {
                request.logger.info('[initEconomyTokens] Creating GAME token...');
                const gameResult = await this.tokenService.createServiceToken(
                    'Game Token', 'GAME', 0, 0,
                    { description: 'Token de juego para el hackathon. Se obtiene jugando.' },
                    backendIdentityKey
                );
                results.push({ token: 'GAME', created: true, tokenId: gameResult.tokenId, txid: gameResult.txid });
            } else {
                results.push({ token: 'GAME', created: false, tokenId: gameToken.id, message: 'Already exists' });
            }

            // NEW LOYALTY SYSTEM TOKENS
            const serviceTokenNew = await this.tokenService.getTokenBySymbol('SERVICE_TOKEN');
            if (!serviceTokenNew) {
                request.logger.info('[initEconomyTokens] Creating SERVICE_TOKEN...');
                const serviceTokenResult = await this.tokenService.createServiceToken(
                    'Service Payment Token', 'SERVICE_TOKEN', 0, 0,
                    { description: 'Token para pagar servicios municipales. Se obtiene comprando con BSV.' },
                    backendIdentityKey
                );
                results.push({ token: 'SERVICE_TOKEN', created: true, tokenId: serviceTokenResult.tokenId, txid: serviceTokenResult.txid });
            } else {
                results.push({ token: 'SERVICE_TOKEN', created: false, tokenId: serviceTokenNew.id, message: 'Already exists' });
            }

            const loyaltyToken = await this.tokenService.getTokenBySymbol('LOYALTY_TOKEN');
            if (!loyaltyToken) {
                request.logger.info('[initEconomyTokens] Creating LOYALTY_TOKEN...');
                const loyaltyResult = await this.tokenService.createServiceToken(
                    'Loyalty Reward Token', 'LOYALTY_TOKEN', 0, 0,
                    { description: 'Token de fidelidad. Se obtiene al usar servicios municipales.' },
                    backendIdentityKey
                );
                results.push({ token: 'LOYALTY_TOKEN', created: true, tokenId: loyaltyResult.tokenId, txid: loyaltyResult.txid });
            } else {
                results.push({ token: 'LOYALTY_TOKEN', created: false, tokenId: loyaltyToken.id, message: 'Already exists' });
            }

            sendApiResult(request, response, {
                success: true,
                message: 'Economy tokens initialized',
                tokens: results
            });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "ECONOMY_ERROR", e.message);
        }
    }

    /**
     * Purchase SERVICE tokens with BSV
     * Binding: PurchaseServiceToken
     * @route POST /tokens/economy/purchase
     * @group tokens-economy
     * @param {object} request.body.required - Purchase data with amount
     * @returns {object} 200 - Tokens purchased
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async purchaseServiceToken(request: Express.Request, response: Express.Response) {
        try {
            const { userId, amount, bsvTxid } = request.body;
            const userIdentity = userId || request.headers['x-bsv-identity-key'] as string;

            if (!userIdentity) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY", "User ID required");
                return;
            }

            if (!amount || amount <= 0) {
                sendApiError(request, response, BAD_REQUEST, "INVALID_AMOUNT", "Amount must be positive");
                return;
            }

            request.logger.info('[purchaseServiceToken] Processing:', { userIdentity: userIdentity.substring(0, 16), amount });

            const result = await this.tokenService.addBalance(userIdentity, 'SERVICE', amount);

            sendApiResult(request, response, {
                success: true,
                message: `Purchased ${amount} SERVICE tokens`,
                userId: userIdentity,
                amount,
                newBalance: result.balance,
                bsvAnchorTxid: result.txid,
                bsvPaymentTxid: bsvTxid || null
            });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "PURCHASE_ERROR", e.message);
        }
    }

    /**
     * Play game - spend SERVICE tokens, earn GAME tokens
     * Binding: PlayGame
     * @route POST /tokens/economy/play
     * @group tokens-economy
     * @param {object} request.body.required - Game data
     * @returns {object} 200 - Game result
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async playGame(request: Express.Request, response: Express.Response) {
        try {
            const { userId, serviceCost, gameReward } = request.body;
            const userIdentity = userId || request.headers['x-bsv-identity-key'] as string;

            if (!userIdentity) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY", "User ID required");
                return;
            }

            const cost = serviceCost || 1;
            const reward = gameReward || 10;

            if (cost <= 0 || reward <= 0) {
                sendApiError(request, response, BAD_REQUEST, "INVALID_AMOUNT", "Cost and reward must be positive");
                return;
            }

            request.logger.info('[playGame] Processing:', { userIdentity: userIdentity.substring(0, 16), cost, reward });

            const burnResult = await this.tokenService.burnBalance(userIdentity, 'SERVICE', cost);
            const mintResult = await this.tokenService.addBalance(userIdentity, 'GAME', reward);
            const balances = await this.tokenService.getEconomyBalances(userIdentity);

            sendApiResult(request, response, {
                success: true,
                message: `Played game! Spent ${cost} SERVICE, earned ${reward} GAME tokens`,
                userId: userIdentity,
                serviceCost: cost,
                gameReward: reward,
                balances,
                burnTxid: burnResult.txid,
                mintTxid: mintResult.txid
            });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "GAME_ERROR", e.message);
        }
    }

    /**
     * Get economy balance for a specific user
     * Binding: GetEconomyBalance
     * @route GET /tokens/economy/balance/{userId}
     * @group tokens-economy
     * @param {string} userId.path.required - User identity key
     * @returns {EconomyBalanceResponse.model} 200 - User balances
     * @returns {TokenErrorResponse.model} 400 - Bad request
     */
    private async getEconomyBalance(request: Express.Request, response: Express.Response) {
        try {
            const { userId } = request.params;

            if (!userId) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_USER_ID", "User ID required");
                return;
            }

            const balances = await this.tokenService.getEconomyBalances(userId);

            sendApiResult(request, response, {
                userId,
                balances: {
                    service: balances.service,
                    game: balances.game
                }
            });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "BALANCE_ERROR", e.message);
        }
    }

    /**
     * Get economy balance for current user
     * Binding: GetMyEconomyBalance
     * @route GET /tokens/economy/balance
     * @group tokens-economy
     * @returns {EconomyBalanceResponse.model} 200 - User balances
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @security AuthToken
     */
    private async getMyEconomyBalance(request: Express.Request, response: Express.Response) {
        try {
            const userId = request.headers['x-bsv-identity-key'] as string;

            if (!userId) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY_KEY", "Missing x-bsv-identity-key header");
                return;
            }

            const balances = await this.tokenService.getEconomyBalances(userId);

            sendApiResult(request, response, {
                userId,
                balances: {
                    service: balances.service,
                    game: balances.game
                }
            });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "BALANCE_ERROR", e.message);
        }
    }

    /**
     * Buy SERVICE_TOKEN credits with BSV (TXID verification)
     * Binding: BuyCredits
     * @route POST /tokens/economy/buy-credits
     * @group tokens-economy
     * @param {object} request.body.required - Purchase data with txid
     * @returns {object} 200 - Credits purchased
     * @returns {TokenErrorResponse.model} 400 - Bad request
     * @returns {TokenErrorResponse.model} 409 - TXID already used
     * @security AuthToken
     */
    private async buyCredits(request: Express.Request, response: Express.Response) {
        try {
            const userIdentity = request.headers['x-bsv-identity-key'] as string;
            const { txid, tokensRequested, satsPaid } = request.body;

            if (!userIdentity) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY", "User identity required");
                return;
            }

            if (!txid || txid.length < 64) {
                sendApiError(request, response, BAD_REQUEST, "INVALID_TXID", "Valid TXID required (64 hex characters)");
                return;
            }

            const isUsed = await UsedBsvTransaction.isTxidUsed(txid);
            if (isUsed) {
                sendApiError(request, response, CONFLICT, "TXID_ALREADY_USED", "This transaction has already been processed");
                return;
            }

            const tokensToGrant = tokensRequested || 50;

            request.logger.info(`[BuyCredits] User ${userIdentity.substring(0, 16)}... buying ${tokensToGrant} tokens`);

            const usedTx = new UsedBsvTransaction({
                id: `credits-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                txid,
                userAddress: userIdentity,
                satoshisReceived: satsPaid || 100,
                tokensGranted: tokensToGrant,
                timestamp: Date.now()
            });
            await usedTx.insert();

            const mintResult = await this.tokenService.addBalance(userIdentity, 'SERVICE_TOKEN', tokensToGrant);
            const balance = await this.tokenService.getBalanceBySymbol(userIdentity, 'SERVICE_TOKEN');

            sendApiResult(request, response, {
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "CREDITS_ERROR", e.message);
        }
    }

    /**
     * Buy SERVICE_TOKEN credits with x402 wallet payment
     * Binding: BuyCreditsX402
     * @route POST /tokens/economy/buy-credits-x402
     * @group tokens-economy
     * @param {object} request.body.required - Purchase data
     * @returns {object} 200 - Credits purchased
     * @returns {void} 402 - Payment required
     * @security AuthToken
     */
    private async buyCreditsX402(request: Express.Request, response: Express.Response) {
        try {
            const paymentHeader = request.headers['x-bsv-payment'] as string;
            const userIdentity = request.headers['x-bsv-identity-key'] as string;
            const { tokensRequested } = request.body;

            if (!paymentHeader) {
                sendApiError(request, response, PAYMENT_REQUIRED, "PAYMENT_REQUIRED", "x-bsv-payment header is required");
                return;
            }

            if (!userIdentity) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_IDENTITY", "User identity required");
                return;
            }

            let paymentData: any;
            try {
                paymentData = JSON.parse(paymentHeader);
            } catch {
                sendApiError(request, response, BAD_REQUEST, "INVALID_PAYMENT_HEADER", "Invalid x-bsv-payment header format");
                return;
            }

            const { senderIdentityKey, amount } = paymentData;
            const payerIdentity = senderIdentityKey || userIdentity;
            const tokensToGrant = tokensRequested || 50;

            request.logger.info(`[BuyCreditsX402] Processing payment for ${payerIdentity.substring(0, 16)}... Amount: ${amount} sats`);

            const mintResult = await this.tokenService.addBalance(payerIdentity, 'SERVICE_TOKEN', tokensToGrant);
            const balance = await this.tokenService.getBalanceBySymbol(payerIdentity, 'SERVICE_TOKEN');

            sendApiResult(request, response, {
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
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "CREDITS_ERROR", e.message);
        }
    }

    // ==========================================
    // BSV PURCHASE ENDPOINT
    // ==========================================

    /**
     * Buy SERVICE tokens with BSV transaction
     * Binding: BuyWithBsv
     * @route POST /tokens/buy-with-bsv
     * @group tokens-economy
     * @param {object} request.body.required - Purchase data with txid and userAddress
     * @returns {object} 200 - Tokens purchased
     * @returns {TokenErrorResponse.model} 400 - Bad request
     */
    private async buyWithBsv(request: Express.Request, response: Express.Response) {
        try {
            const { txid, userAddress } = request.body;

            if (!txid) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_TXID", "txid is required");
                return;
            }

            if (!userAddress) {
                sendApiError(request, response, BAD_REQUEST, "MISSING_ADDRESS", "userAddress is required");
                return;
            }

            const txidRegex = /^[a-fA-F0-9]{64}$/;
            if (!txidRegex.test(txid)) {
                sendApiError(request, response, BAD_REQUEST, "INVALID_TXID", "Invalid txid format. Must be 64 hexadecimal characters");
                return;
            }

            const isUsed = await UsedBsvTransaction.isTxidUsed(txid);
            if (isUsed) {
                sendApiError(request, response, BAD_REQUEST, "TXID_ALREADY_USED", "This transaction has already been used");
                return;
            }

            request.logger.info('[buyWithBsv] Processing purchase:', { txid: txid.substring(0, 16), userAddress: userAddress.substring(0, 16) });

            // HACKATHON MODE: Simulated amount
            const satoshisReceived = 100000;
            let verificationMethod = 'simulated';

            try {
                const bsvService = BsvService.getInstance();
                await bsvService.ready();
                const txHex = await bsvService.getTransaction(txid);
                if (txHex && txHex.length > 0) {
                    verificationMethod = 'blockchain_verified';
                    request.logger.info('[buyWithBsv] Transaction found on blockchain');
                }
            } catch (fetchError: any) {
                request.logger.info('[buyWithBsv] Using simulated amount:', fetchError.message);
            }

            const tokensToGrant = Math.floor(satoshisReceived / 1000);

            if (tokensToGrant <= 0) {
                sendApiError(request, response, BAD_REQUEST, "AMOUNT_TOO_SMALL", "Amount too small to grant tokens");
                return;
            }

            const mintResult = await this.tokenService.addBalance(userAddress, 'SERVICE', tokensToGrant);

            const usedTx = new UsedBsvTransaction({
                id: createRandomUID(),
                txid,
                userAddress,
                satoshisReceived,
                tokensGranted: tokensToGrant,
                timestamp: Date.now()
            } as any);
            await usedTx.insert();

            request.logger.info('[buyWithBsv] Purchase successful:', { txid: txid.substring(0, 16), tokensGranted: tokensToGrant });

            sendApiResult(request, response, {
                success: true,
                txid,
                userAddress,
                satoshisReceived,
                tokensGranted: tokensToGrant,
                newBalance: mintResult.balance,
                bsvAnchorTxid: mintResult.txid,
                verificationMethod,
                conversion: {
                    rate: '1000 satoshis = 1 SERVICE token',
                    bsvAmount: satoshisReceived / 100000000
                }
            });
        } catch (e: any) {
            request.logger.error(e);
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "PURCHASE_ERROR", e.message);
        }
    }
}
