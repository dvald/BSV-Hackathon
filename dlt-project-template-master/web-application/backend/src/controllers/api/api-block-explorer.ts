// Reserved for license

"use strict";

import Express from "express";
import { Controller } from "../controller";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, noCache, NOT_FOUND, sendApiError, sendApiResult, sendUnauthorized } from "../../utils/http-utils";
import { Monitor } from "../../monitor";
import { AccountInformation, Block, BlockchainService, SimpleBlock, Transaction } from "../../services/blockchain-service";
import { validateAddress } from "../../utils/blockchain";
import { UsersService } from "../../services/users-service";

/**
* This value indicates whether the block explorer is public
* If false, a session token will be required
*/
const PUBLIC_BLOCK_EXPLORER = true;

const MAX_QUERY_LENGTH = 66;

/**
 * Block Explorer API
 * @group block_explorer
 */
export class BlockExplorerController extends Controller {
    public registerAPI(prefix: string, application: Express.Express): any {

        application.get(prefix + "/block-explorer/search", noCache(this.search.bind(this)));
        application.get(prefix + "/block-explorer/last-blocks", noCache(this.getLastBlocks.bind(this)));
        
        application.get(prefix + "/block-explorer/blocks/:block", noCache(this.getBlock.bind(this)));
        application.get(prefix + "/block-explorer/account/:address", noCache(this.getAccount.bind(this)));
        application.get(prefix + "/block-explorer/transactions/:tx", noCache(this.getTransaction.bind(this)));
    }

    /**
     * @typedef ExplorerSearchInformationItem
     * @property {number} balance - Account balance (ETH)
     * @property {number} totalTransactions - Total transactions
     * @property {boolean} isContract - True if address is a contract, false if not
     * @property {number} number - Block number
     * @property {string} mixHash - Mix hash
     * @property {string} parentHash - Parent hash
     * @property {string} sha3Uncles - sha3Uncles
     * @property {string} logsBloom - Logs bloom
     * @property {string} transactionsRoot - Transactions root
     * @property {string} stateRoot - State root
     * @property {string} receiptsRoot - Receipts root
     * @property {string} miner - Miner address
     * @property {number} difficulty - Difficulty
     * @property {number} totalDifficulty - Total difficulty
     * @property {string} extraData - Extra data
     * @property {number} size - Block size
     * @property {number} gasLimit - Gas limit
     * @property {number} gasUsed - Gas used
     * @property {number} baseFeePerGas - Base fee per gas
     * @property {number} timestamp - Block timestamp
     * @property {Array.<string>} transactions - Block transactions hashes list
     * @property {string} blockHash - Block hash
     * @property {number} blockNumber - Block number
     * @property {string} chainId - Chain ID
     * @property {string} from - From address
     * @property {number} gas - Gas
     * @property {number} gasPrice - Gas price
     * @property {number} maxPriorityFeePerGas - Max priority fee per gas
     * @property {number} maxFeePerGas - Max fee per gas
     * @property {string} hash - Block or transaction hash
     * @property {string} input - Transaction input
     * @property {string} nonce - Nonce
     * @property {string} to - To address
     * @property {number} transactionIndex - Transaction index
     * @property {number} type - Transaction type
     * @property {number} value - Transaction value
     * @property {number} yParity - y parity
     * @property {string} v - V
     * @property {string} r - R
     * @property {string} s - S
     */

    /**
     * @typedef ExplorerSearchInformation
     * @property {string} mode.required - Mode: account, block, transaction
     * @property {ExplorerSearchInformationItem.model} info - Information
     */

    /**
     * Searchs block, transaction or account information
     * Binding: Search
     * @route GET /block-explorer/search
     * @group block_explorer
     * @param {string} q.query.required - Search query
     * @returns {ExplorerSearchInformation.model} 200 - Block, transaction or account information
     * @returns {void} 400 - Bad request
     * @returns {void} 404 - Not found: TRANSACTION_NOT_FOUND, BLOCK_NOT_FOUND
     * @security AuthToken
     */
    public async search(request: Express.Request, response: Express.Response) {
        if(!PUBLIC_BLOCK_EXPLORER) {
            const auth = await UsersService.getInstance().auth(request);
            if (!auth.isRegisteredUser()) {
                sendUnauthorized(request, response);
                return;
            }
        }

        const query = (request.query.q || "") + "";

        if(query.length > MAX_QUERY_LENGTH) {
            sendApiError(
                request,
                response,
                BAD_REQUEST,
                "INVALID_QUERY",
            );
            return;
        }

        let info: Block | Transaction | { balance: number };
        let mode = "block";

        try {
            if(query.startsWith("0x")) {
                if(query.length === 66) {
                    mode = "transaction";
                    info = await BlockchainService.getInstance().getTransaction(query);

                    if(!info) {
                        sendApiError(
                            request,
                            response,
                            NOT_FOUND,
                            "TRANSACTION_NOT_FOUND",
                        );
                        return;
                    }
                } else if(query.length === 42) {
                    mode = "account";
                    info =  await BlockchainService.getInstance().getAccountInfo(query);
                } else {
                    sendApiError(
                        request,
                        response,
                        BAD_REQUEST,
                        "INVALID_QUERY"
                    );
                    return;
                }
            } else {
                let blockNumber: number;

                try {
                    blockNumber = parseInt(query, 10);
                } catch (ex) {
                    Monitor.exception(ex);
                    sendApiError(
                        request,
                        response,
                        BAD_REQUEST,
                        "INVALID_QUERY",
                    );
                    return;
                }

                if (isNaN(blockNumber)) {
                    sendApiError(
                        request,
                        response,
                        BAD_REQUEST,
                        "INVALID_QUERY",
                    );
                    return;
                }

                info = await BlockchainService.getInstance().getBlockByNumber(blockNumber);

                if(!info) {
                    sendApiError(
                        request,
                        response,
                        NOT_FOUND,
                        "BLOCK_NOT_FOUND",
                    );
                    return;
                }
            }
        } catch (ex) {
            sendApiError(
                request,
                response,
                INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                ex.message,
            );
            return;
        }

        sendApiResult(request, response, {
            mode: mode,
            info: info,
        });
    }

    /**
     * @typedef BlockInformationMin
     * @property {number} number - Block number
     * @property {string} hash - Block hash
     * @property {string} miner - Miner address
     * @property {number} size - Block size
     * @property {number} timestamp - Timestamp
     * @property {number} transactions - Transactions length
     */

    /**
     * Gets last blocks
     * Binding: GetLastBlock
     * @route GET /block-explorer/last-blocks
     * @group block_explorer
     * @returns {Array.<BlockInformationMin>} 200 - Block information
     * @security AuthToken
     */
    public async getLastBlocks(request: Express.Request, response: Express.Response) {
        if(!PUBLIC_BLOCK_EXPLORER) {
            const auth = await UsersService.getInstance().auth(request);
            if (!auth.isRegisteredUser()) {
                sendUnauthorized(request, response);
                return;
            }
        }

        let blocks: SimpleBlock[];

        try {
            blocks = await BlockchainService.getInstance().getLatestBlocks();
        } catch (ex) {
            sendApiError(
                request,
                response,
                INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                ex.message,
            );
            return;
        }

        sendApiResult(request, response, blocks);
    }

    /**
     * @typedef BlockInformation
     * @property {number} number - Block number
     * @property {string} hash - Block hash
     * @property {string} mixHash - Mix hash
     * @property {string} parentHash - Parent hash
     * @property {string} nonce - Nonce
     * @property {string} sha3Uncles - sha3Uncles
     * @property {string} logsBloom - Logs bloom
     * @property {string} transactionsRoot - Transactions root
     * @property {string} stateRoot - State root
     * @property {string} receiptsRoot - Receipts root
     * @property {string} miner - Miner address
     * @property {number} difficulty - Difficulty
     * @property {number} totalDifficulty - Total difficulty
     * @property {string} extraData - Extra data
     * @property {number} size - Block size
     * @property {number} gasLimit - Gas limit
     * @property {number} gasUsed - Gas used
     * @property {number} baseFeePerGas - Base fee per gas
     * @property {number} timestamp - Block timestamp
     * @property {Array.<string>} transactions - Block transactions hashes list
     */

    /**
     * Gets block information
     * Binding: GetBlock
     * @route GET /block-explorer/blocks/{block}
     * @group block_explorer
     * @param {string} block.path.required - Block number or hash
     * @returns {BlockInformation.model} 200 - Block information
     * @returns {void} 400 - Bad request: INVALID_BLOCK_HASH, INVALID_BLOCK
     * @returns {void} 404 - Not found: BLOCK_NOT_FOUND
     * @security AuthToken
     */
    public async getBlock(request: Express.Request, response: Express.Response) {
        if(!PUBLIC_BLOCK_EXPLORER) {
            const auth = await UsersService.getInstance().auth(request);
            if (!auth.isRegisteredUser()) {
                sendUnauthorized(request, response);
                return;
            }
        }

        const block = (request.params.block || "") + "";

        let blockInfo: Block;

        try {
            if(block.startsWith("0x")) {

                const isValidHash = /^0x[a-fA-F0-9]{64}$/.test(block);

                if (!isValidHash) {
                    sendApiError(
                        request,
                        response,
                        BAD_REQUEST,
                        "INVALID_BLOCK_HASH"
                    );
                    return;
                }

                blockInfo = await BlockchainService.getInstance().getBlockByHash(block);
            } else {
                if (!/^-?(0|[1-9]\d*)$/.test(block)) {
                    sendApiError(
                        request,
                        response,
                        BAD_REQUEST,
                        "INVALID_BLOCK",
                    );
                    return;
                }

                let blockNumber: number;

                try {
                    blockNumber = parseInt(block, 10);
                } catch (ex) {
                    Monitor.exception(ex);
                    sendApiError(
                        request,
                        response,
                        BAD_REQUEST,
                        "INVALID_BLOCK",
                    );
                    return;
                }

                if (isNaN(blockNumber)) {
                    sendApiError(
                        request,
                        response,
                        BAD_REQUEST,
                        "INVALID_BLOCK",
                    );
                    return;
                }

                blockInfo = await BlockchainService.getInstance().getBlockByNumber(blockNumber);
            }
        } catch (ex) {
            sendApiError(
                request,
                response,
                INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                ex.message,
            );
            return;
        }

        if(!blockInfo) {
            sendApiError(
                request,
                response,
                NOT_FOUND,
                "BLOCK_NOT_FOUND",
            );
            return;
        }

        sendApiResult(request, response, blockInfo);
    }

    /**
     * @typedef AccountInformation
     * @property {number} balance - Account balance
     * @property {number} totalTransactions - Total transactions
     * @property {boolean} isContract - True if address is a contract, false if not
     */

    /**
     * Gets account information
     * Binding: GetAccount
     * @route GET /block-explorer/account/{address}
     * @group block_explorer
     * @param {string} address.path.required - Account address
     * @returns {AccountInformation.model} 200 - Account information
     * @returns {void} 400 - Bad request: INVALID_WALLET_ADDRESS
     * @security AuthToken
     */
    public async getAccount(request: Express.Request, response: Express.Response) {
        if(!PUBLIC_BLOCK_EXPLORER) {
            const auth = await UsersService.getInstance().auth(request);
            if (!auth.isRegisteredUser()) {
                sendUnauthorized(request, response);
                return;
            }
        }

        const address = (request.params.address || "") + "";

        if(!validateAddress(address)) {
            response.status(BAD_REQUEST);
            response.json({ code: "INVALID_WALLET_ADDRESS" });
            return;
        }

        let info: AccountInformation;

        try {
            info = await BlockchainService.getInstance().getAccountInfo(address);
        } catch (ex) {
            sendApiError(
                request,
                response,
                INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                ex.message,
            );
            return;
        }

        sendApiResult(request, response, info);
    }

    /**
     * @typedef TransactionInformation
     * @property {string} blockHash - Block hash
     * @property {number} blockNumber - Block number
     * @property {string} chainId - Chain ID
     * @property {string} from - From address
     * @property {number} gas - Gas
     * @property {number} gasPrice - Gas price
     * @property {number} maxPriorityFeePerGas - Max priority fee per gas
     * @property {number} maxFeePerGas - Max fee per gas
     * @property {string} hash - Transaction hash
     * @property {string} input - Transaction input
     * @property {string} nonce - Nonce
     * @property {string} to - To address
     * @property {number} transactionIndex - Transaction index
     * @property {number} type - Transaction type
     * @property {number} value - Transaction value
     * @property {number} yParity - y parity
     * @property {string} v - V
     * @property {string} r - R
     * @property {string} s - S
     */

    /**
     * Gets transaction information
     * Binding: GetTransaction
     * @route GET /block-explorer/transactions/{tx}
     * @group block_explorer
     * @param {string} tx.path.required - Transaction hash
     * @returns {TransactionInformation.model} 200 - Transaction information
     * @returns {void} 400 - Bad request: INVALID_TRANSACTION
     * @returns {void} 404 - Not found: TRANSACTION_NOT_FOUND
     * @security AuthToken
     */
    public async getTransaction(request: Express.Request, response: Express.Response) {
        if(!PUBLIC_BLOCK_EXPLORER) {
            const auth = await UsersService.getInstance().auth(request);
            if (!auth.isRegisteredUser()) {
                sendUnauthorized(request, response);
                return;
            }
        }

        const tx = (request.params.tx || "") + "";

        if(tx.length !== MAX_QUERY_LENGTH) {
            sendApiError(
                request,
                response,
                BAD_REQUEST,
                "INVALID_TRANSACTION",
            );
            return;
        }

        let transactionInfo: Transaction;

        try {    
            transactionInfo = await BlockchainService.getInstance().getTransaction(tx);
        } catch (ex) {
            sendApiError(
                request,
                response,
                INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                ex.message,
            );
            return;
        }

        if(!transactionInfo) {
            sendApiError(
                request,
                response,
                NOT_FOUND,
                "TRANSACTION_NOT_FOUND",
            );
            return;
        }

        sendApiResult(request, response, transactionInfo);
    }
}