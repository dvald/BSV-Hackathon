// API bindings: token (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonAuthenticatedErrorHandler } from "@asanrom/request-browser";
import { getApiUrl } from "./utils";
import { PurchaseTokenResponse, PurchaseTokenRequest } from "./definitions";

export class ApiToken {
    /**
     * Method: POST
     * Path: /purchase-token
     * Purchase tokens using Stripe (legacy endpoint)
     * @param body Body parameters
     * @returns The request parameters
     */
    public static PurchaseToken(body: PurchaseTokenRequest): RequestParams<PurchaseTokenResponse, PurchaseTokenErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/purchase-token`),
            json: body,
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(400, "STRIPE_NOT_CONFIGURED", handler.badRequestStripeNotConfigured)
                    .add(400, "TOKEN_NOT_FOUND", handler.badRequestTokenNotFound)
                    .add(400, "INVALID_AMOUNT", handler.badRequestInvalidAmount)
                    .add(400, "MISSING_HOLDER_IDENTITY_KEY", handler.badRequestMissingHolderIdentityKey)
                    .add(400, "MISSING_AMOUNT", handler.badRequestMissingAmount)
                    .add(400, "MISSING_TOKEN_ID", handler.badRequestMissingTokenId)
                    .add(400, "*", handler.badRequest)
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: POST
     * Path: /purchase-token/checkout
     * Create Stripe checkout session for token purchase
     * @param body Body parameters
     * @returns The request parameters
     */
    public static CreateTokenPurchaseCheckout(body: PurchaseTokenRequest): RequestParams<PurchaseTokenResponse, CreateTokenPurchaseCheckoutErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/purchase-token/checkout`),
            json: body,
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(400, "STRIPE_NOT_CONFIGURED", handler.badRequestStripeNotConfigured)
                    .add(400, "TOKEN_NOT_FOUND", handler.badRequestTokenNotFound)
                    .add(400, "INVALID_AMOUNT", handler.badRequestInvalidAmount)
                    .add(400, "MISSING_HOLDER_IDENTITY_KEY", handler.badRequestMissingHolderIdentityKey)
                    .add(400, "MISSING_AMOUNT", handler.badRequestMissingAmount)
                    .add(400, "MISSING_TOKEN_ID", handler.badRequestMissingTokenId)
                    .add(400, "*", handler.badRequest)
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }
}

/**
 * Error handler for PurchaseToken
 */
export type PurchaseTokenErrorHandler = CommonAuthenticatedErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;






};

/**
 * Error handler for CreateTokenPurchaseCheckout
 */
export type CreateTokenPurchaseCheckoutErrorHandler = CommonAuthenticatedErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;






};

