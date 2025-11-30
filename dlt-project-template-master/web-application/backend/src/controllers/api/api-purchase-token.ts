"use strict";

import Express from "express";
import { Monitor } from "../../monitor";

import { Controller } from "../controller";
import { StripeService } from "../../services/stripe-service";
import { UsersService } from "../../services/users-service";
import { TokenService } from "../../services/token-service";
import { BAD_REQUEST, ensureObjectBody, INTERNAL_SERVER_ERROR, sendApiError, sendApiResult, sendUnauthorized } from "../../utils/http-utils";
import { Config } from "../../config/config";
import { Token } from "../../models/tokens/token";

/**
 * Token Purchase API Controller
 * Process token purchases using Stripe
 * @group token-purchase - Token Purchase API
 */
export class ApiPurchaseTokenController extends Controller {
    public registerAPI(prefix: string, application: Express.Express): any {
        application.post(prefix + "/purchase-token", ensureObjectBody(this.purchaseToken.bind(this)));
        application.post(prefix + "/purchase-token/checkout", ensureObjectBody(this.createCheckout.bind(this)));
    }

    /**
     * @typedef PurchaseTokenRequest
     * @property {string} token_id.required - Token ID to purchase
     * @property {number} amount.required - Amount of tokens to purchase
     * @property {string} holder_identity_key.required - BSV identity key of the recipient
     */

    /**
     * @typedef PurchaseTokenResponse
     * @property {string} url.required - Stripe checkout URL
     */

    /**
     * @typedef PurchaseTokenBadRequest
     * @property {string} code.required - Error code:
     * - MISSING_TOKEN_ID
     * - MISSING_AMOUNT
     * - MISSING_HOLDER_IDENTITY_KEY
     * - INVALID_AMOUNT
     * - TOKEN_NOT_FOUND
     * - STRIPE_NOT_CONFIGURED
     */

    /**
     * Purchase tokens using Stripe (legacy endpoint)
     * Binding: PurchaseToken
     * @route POST /purchase-token
     * @group token-purchase
     * @param {PurchaseTokenRequest.model} request.body.required - Purchase request
     * @returns {PurchaseTokenResponse.model} 200 - Checkout URL
     * @returns {PurchaseTokenBadRequest.model} 400 - Bad request
     * @security AuthToken
     */
    public async purchaseToken(request: Express.Request, response: Express.Response) {
        return this.createCheckout(request, response);
    }

    /**
     * Create Stripe checkout session for token purchase
     * Binding: CreateTokenPurchaseCheckout
     * @route POST /purchase-token/checkout
     * @group token-purchase
     * @param {PurchaseTokenRequest.model} request.body.required - Purchase request
     * @returns {PurchaseTokenResponse.model} 200 - Checkout URL
     * @returns {PurchaseTokenBadRequest.model} 400 - Bad request
     * @security AuthToken
     */
    public async createCheckout(request: Express.Request, response: Express.Response) {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const { token_id, amount, holder_identity_key } = request.body;

            // Validationn`pm
            if (!token_id) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_TOKEN_ID", "Token ID is required");
            }
            if (!amount) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_AMOUNT", "Amount is required");
            }
            if (!holder_identity_key) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_HOLDER_IDENTITY_KEY", "Holder identity key is required");
            }

            const tokenAmount = parseInt(amount, 10);
            if (isNaN(tokenAmount) || tokenAmount <= 0) {
                return sendApiError(request, response, BAD_REQUEST, "INVALID_AMOUNT", "Amount must be a positive number");
            }

            // Check token exists - first try by ID, then by symbol
            let token = await Token.finder.findByKey(token_id);
            if (!token) {
                // Try to find by symbol (e.g., "SERVICE", "LOYALTY")
                token = await TokenService.getInstance().getTokenBySymbol(token_id);
            }
            if (!token) {
                return sendApiError(request, response, BAD_REQUEST, "TOKEN_NOT_FOUND", "Token not found");
            }

            // Check Stripe is configured
            const stripeService = StripeService.getInstance();
            if (!stripeService.client) {
                return sendApiError(request, response, BAD_REQUEST, "STRIPE_NOT_CONFIGURED", "Payment service is not available");
            }

            // Calculate price (1 token = 1 cent EUR, adjust as needed)
            const pricePerToken = 1; // cents
            const totalPriceInCents = tokenAmount * pricePerToken;

            const successUrl = Config.getInstance().getFrontendURI(`/#/tokens/purchase/success?token_id=${token_id}`);
            const cancelUrl = Config.getInstance().getFrontendURI(`/#/tokens/purchase/cancel?token_id=${token_id}`);

            // Create Stripe checkout session
            const checkout = await stripeService.client.checkout.sessions.create({
                mode: "payment",
                line_items: [
                    {
                        price_data: {
                            currency: "eur",
                            unit_amount: pricePerToken,
                            product_data: {
                                name: `${token.name} (${token.symbol})`,
                                description: `Purchase ${tokenAmount} ${token.symbol} tokens`,
                            },
                        },
                        quantity: tokenAmount,
                    }
                ],
                metadata: {
                    kind: "token_purchase",
                    token_id: token_id,
                    amount: tokenAmount.toString(),
                    holder_identity_key: holder_identity_key,
                    uid: auth.uid,
                },
                success_url: successUrl,
                cancel_url: cancelUrl,
            });

            Monitor.info(`Token purchase checkout created: session=${checkout.id}, token=${token_id}, amount=${tokenAmount}, user=${auth.uid}`);

            sendApiResult(request, response, {
                url: checkout.url,
                session_id: checkout.id,
            });
        } catch (error) {
            Monitor.exception(error, "ApiPurchaseTokenController.createCheckout");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }
}