// API bindings: block_explorer (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonAuthenticatedErrorHandler } from "@asanrom/request-axios";
import { getApiUrl, generateURIQuery } from "./utils";
import { ExplorerSearchInformation, BlockInformationMin, BlockInformation, AccountInformation, TransactionInformation } from "./definitions";

export class ApiBlockExplorer {
    /**
     * Method: GET
     * Path: /block-explorer/search
     * Searchs block, transaction or account information
     * @param queryParams Query parameters
     * @returns The request parameters
     */
    public static Search(queryParams: SearchQueryParameters): RequestParams<ExplorerSearchInformation, SearchErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/block-explorer/search` + generateURIQuery(queryParams)),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(404, "BLOCK_NOT_FOUND", handler.notFoundBlockNotFound)
                    .add(404, "TRANSACTION_NOT_FOUND", handler.notFoundTransactionNotFound)
                    .add(404, "*", handler.notFound)
                    .add(400, "*", handler.badRequest)
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /block-explorer/last-blocks
     * Gets last blocks
     * @returns The request parameters
     */
    public static GetLastBlock(): RequestParams<BlockInformationMin[], CommonAuthenticatedErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/block-explorer/last-blocks`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /block-explorer/blocks/{block}
     * Gets block information
     * @param block Block number or hash
     * @returns The request parameters
     */
    public static GetBlock(block: string): RequestParams<BlockInformation, GetBlockErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/block-explorer/blocks/${encodeURIComponent(block)}`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(404, "BLOCK_NOT_FOUND", handler.notFoundBlockNotFound)
                    .add(404, "*", handler.notFound)
                    .add(400, "INVALID_BLOCK", handler.badRequestInvalidBlock)
                    .add(400, "INVALID_BLOCK_HASH", handler.badRequestInvalidBlockHash)
                    .add(400, "*", handler.badRequest)
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /block-explorer/account/{address}
     * Gets account information
     * @param address Account address
     * @returns The request parameters
     */
    public static GetAccount(address: string): RequestParams<AccountInformation, GetAccountErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/block-explorer/account/${encodeURIComponent(address)}`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(400, "INVALID_WALLET_ADDRESS", handler.badRequestInvalidWalletAddress)
                    .add(400, "*", handler.badRequest)
                    .add(401, "*", handler.unauthorized)
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }

    /**
     * Method: GET
     * Path: /block-explorer/transactions/{tx}
     * Gets transaction information
     * @param tx Transaction hash
     * @returns The request parameters
     */
    public static GetTransaction(tx: string): RequestParams<TransactionInformation, GetTransactionErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/block-explorer/transactions/${encodeURIComponent(tx)}`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(404, "TRANSACTION_NOT_FOUND", handler.notFoundTransactionNotFound)
                    .add(404, "*", handler.notFound)
                    .add(400, "INVALID_TRANSACTION", handler.badRequestInvalidTransaction)
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
 * Error handler for Search
 */
export type SearchErrorHandler = CommonAuthenticatedErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;

    /**
     * General handler for status = 404
     */
    notFound: () => void;

    /**
     * Handler for status = 404 and code = TRANSACTION_NOT_FOUND
     */
    notFoundTransactionNotFound: () => void;

    /**
     * Handler for status = 404 and code = BLOCK_NOT_FOUND
     */
    notFoundBlockNotFound: () => void;
};

/**
 * Query parameters for Search
 */
export interface SearchQueryParameters {
    /**
     * Search query
     */
    q: string;
}

/**
 * Error handler for GetBlock
 */
export type GetBlockErrorHandler = CommonAuthenticatedErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;

    /**
     * Handler for status = 400 and code = INVALID_BLOCK_HASH
     */
    badRequestInvalidBlockHash: () => void;

    /**
     * Handler for status = 400 and code = INVALID_BLOCK
     */
    badRequestInvalidBlock: () => void;

    /**
     * General handler for status = 404
     */
    notFound: () => void;

    /**
     * Handler for status = 404 and code = BLOCK_NOT_FOUND
     */
    notFoundBlockNotFound: () => void;
};

/**
 * Error handler for GetAccount
 */
export type GetAccountErrorHandler = CommonAuthenticatedErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;

    /**
     * Handler for status = 400 and code = INVALID_WALLET_ADDRESS
     */
    badRequestInvalidWalletAddress: () => void;
};

/**
 * Error handler for GetTransaction
 */
export type GetTransactionErrorHandler = CommonAuthenticatedErrorHandler & {
    /**
     * General handler for status = 400
     */
    badRequest: () => void;

    /**
     * Handler for status = 400 and code = INVALID_TRANSACTION
     */
    badRequestInvalidTransaction: () => void;

    /**
     * General handler for status = 404
     */
    notFound: () => void;

    /**
     * Handler for status = 404 and code = TRANSACTION_NOT_FOUND
     */
    notFoundTransactionNotFound: () => void;
};

