// API bindings: crowdfunding (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonErrorHandler } from "@asanrom/request-browser";
import { getApiUrl, generateURIQuery } from "./utils";
import { WalletInfo, CrowdfundingStatus, InvestmentResponse } from "./definitions";

export class ApiCrowdfunding {
    /**
     * Method: GET
     * Path: /api/v1/bsv/wallet-info
     * Returns backend wallet's identity key
     * @returns The request parameters
     */
    public static GetWalletInfo(): RequestParams<WalletInfo, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/api/v1/bsv/wallet-info` + generateURIQuery({ _time: Date.now() })),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /api/v1/bsv/status
     * Returns current crowdfunding status
     * @returns The request parameters
     */
    public static GetCrowdfundingStatus(): RequestParams<CrowdfundingStatus, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/api/v1/bsv/status` + generateURIQuery({ _time: Date.now() })),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: POST
     * Path: /api/v1/bsv/invest
     * Accepts an investment payment
     * @returns The request parameters
     */
    public static Invest(): RequestParams<InvestmentResponse, InvestErrorHandler> {
        return {
            method: "POST",
            url: getApiUrl(`/api/v1/bsv/invest` + generateURIQuery({ _time: Date.now() })),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(402, "*", handler.status402)
                    .add(400, "*", handler.badRequest)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }
}

/**
 * Error handler for Invest
 */
export type InvestErrorHandler = CommonErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;

    /**
     * General handler for status = 402
     */
    status402: () => void;
};

