// Blockchain service

"use strict";

import { MethodTransactionOptions, TransactionSendingOptions, Web3RPCClient } from "@asanrom/smart-contract-wrapper";
import { BlockchainConfig } from "../config/config-blockchain";
import { DynamicConfiguration } from "../models/dynconf";
import { Monitor } from "../monitor";
import { DYN_CONF_CURRENT_BLOCK } from "./blockchain-events-scan";
import { Wallet } from "../models/wallet";
import { User } from "../models/users/user";
import { ethers } from "ethers";

/**
 * User wallet information
 */
export interface ProvidedUserWallet {
    /**
     * The wallet retrieved from the database
     * This is null if the wallet was not found
     */
    wallet: Wallet | null,

    /**
     * The private key of the wallet
     * This is null if the password is not specified or invalid
     */
    privateKey: Buffer | null,
}

/**
 * Transaction information
 */
export interface Transaction {
    blockHash: string;
    blockNumber: number;
    chainId: string;
    from: string;
    gas: number;
    gasPrice: number;
    maxPriorityFeePerGas: number;
    maxFeePerGas: number;
    hash: string;
    input: string;
    nonce: string;
    to: string;
    transactionIndex: number;
    type: number;
    value: number;
    yParity: number;
    v: string;
    r: string;
    s: string;
}

/**
 * Block information
 */
export interface Block {
    number: number;
    hash: string;
    mixHash: string;
    parentHash: string;
    nonce: string;
    sha3Uncles: string;
    logsBloom: string;
    transactionsRoot: string;
    stateRoot: string;
    receiptsRoot: string;
    miner: string;
    difficulty: number;
    totalDifficulty: number;
    extraData: string;
    size: number;
    gasLimit: number;
    gasUsed: number;
    baseFeePerGas: number;
    timestamp: number;
    transactions: string[];
}

/**
 * Account information
 */
export interface AccountInformation {
    balance: number;
    totalTransactions: number;
    isContract: boolean;
}

/**
 * Simple block information
 */
export interface SimpleBlock {
    number: number;
    hash: string;
    miner: string;
    size: number;
    timestamp: number;
    transactions: number;
}

/**
 * Blockchain service
 */
export class BlockchainService {
    /* Singleton */

    public static instance: BlockchainService = null;

    public static getInstance(): BlockchainService {
        if (BlockchainService.instance) {
            return BlockchainService.instance;
        } else {
            BlockchainService.instance = new BlockchainService();
            return BlockchainService.instance;
        }
    }

    constructor() {
    }

    /**
     * Gets a wallet from the request
     * @param walletId The wallet ID
     * @param user The user that is authenticated
     * @param walletPassword The wallet password (required to get the private key)
     * @returns The wallet + private key (if unlocked)
     */
    public async getWallet(walletId: string, user: User, walletPassword?: string): Promise<ProvidedUserWallet> {
        if (!walletId) {
            return {
                wallet: null,
                privateKey: null,
            };
        }

        const wallet = await Wallet.findById(walletId);

        if (!wallet || wallet.uid !== user.id) {
            return {
                wallet: null,
                privateKey: null,
            };
        }

        if (!walletPassword || !wallet.checkPassword(walletPassword)) {
            return {
                wallet: wallet,
                privateKey: null,
            };
        }

        const privateKey = wallet.unlock(walletPassword);

        return {
            wallet: wallet,
            privateKey: privateKey,
        };
    }

    /**
     * Gets smart contract method transaction options for an user wallet
     * Note: The private key must be not null for this to work
     * @param wallet The user wallet information
     * @returns The smart contract method transaction options
     */
    public getMethodTransactionOptions(wallet: ProvidedUserWallet): MethodTransactionOptions {
        return {
            privateKey: wallet.privateKey,
            logFunction: msg => {
                Monitor.debug(msg);
            },
        };
    }

    /**
     * Gets transaction sending options for an user wallet
     * Note: The private key must be not null for this to work
     * @param wallet The user wallet information
     * @returns The transaction sending options
     */
    public getTransactionSendingOptions(wallet: ProvidedUserWallet): TransactionSendingOptions {
        return {
            provider: BlockchainConfig.getInstance().provider,
            privateKey: wallet.privateKey,
            logFunction: msg => {
                Monitor.debug(msg);
            },
        };
    }

    /**
     * Gets smart contract method transaction options for the administrator private key
     * @returns The smart contract method transaction options
     */
    public getMethodTransactionOptionsAdmin(): MethodTransactionOptions {
        return {
            privateKey: BlockchainConfig.getInstance().privateKeys.admin,
            logFunction: msg => {
                Monitor.debug(msg);
            },
        };
    }

    /**
     * Gets transaction sending options for the administrator private key
     * @returns The transaction sending options
     */
    public getTransactionSendingOptionsAdmin(): TransactionSendingOptions {
        return {
            provider: BlockchainConfig.getInstance().provider,
            privateKey: BlockchainConfig.getInstance().privateKeys.admin,
            logFunction: msg => {
                Monitor.debug(msg);
            },
        };
    }

    /**
     * Waits for a block to be synced
     * @param block The block number to wait for
     * @param maxSecondsWait Max number of seconds to wait
     */
    public async waitForBlockSync(block: bigint, maxSecondsWait?: number) {
        let remainingTries = maxSecondsWait || 10;

        while (remainingTries > 0) {
            const currentBlock = await DynamicConfiguration.getStringConfiguration(DYN_CONF_CURRENT_BLOCK, "");

            if (currentBlock) {
                const blockQ = BigInt(currentBlock);
                if (blockQ >= block) {
                    return; // Done
                }
            }

            remainingTries--;

            await (new Promise(resolve => {
                setTimeout(resolve, 1000);
            }));
        }
    }

    /**
     * Gets the latest blocks
     * @returns The latest 15 blocks
     */
    public async getLatestBlocks(): Promise<SimpleBlock[]> {

        const latestBlocks = [];

        const latestBlock = await Web3RPCClient.getInstance().rpcRequest("eth_getBlockByNumber", ["latest", false], { provider: BlockchainConfig.getInstance().provider });
        
        if(latestBlock) {
            const latestBlockNumber = Number(latestBlock.number);
        
            for (let i = latestBlockNumber; i > latestBlockNumber - 15; i--) {
                const block = await Web3RPCClient.getInstance().rpcRequest("eth_getBlockByNumber", ["" + i, false], { provider: BlockchainConfig.getInstance().provider });
                if (block) {
                    try {
                        latestBlocks.push({
                            number: Number(block.number),
                            hash: block.hash,
                            miner: block.miner,
                            size: Number(block.size),
                            timestamp: Number(block.timestamp) * 1000,
                            transactions: block.transactions.length,
                        });
                    } catch (ex) {
                        Monitor.exception(ex);
                    }
                }
            }
        }
        
        return latestBlocks;
    }

    /**
     * Gets a block information by hash
     * @param block The block hash
     * @returns The block information
     */
    public async getBlockByHash(block: string): Promise<Block> {
        let result: Block;
        try {
            const blockFound = await Web3RPCClient.getInstance().rpcRequest("eth_getBlockByHash", ["" + block, false], { provider: BlockchainConfig.getInstance().provider });

            if (!blockFound) {
                return null;
            }

            result = ({
                number: Number(blockFound.number),
                hash: blockFound.hash,
                mixHash: blockFound.mixHash,
                parentHash: blockFound.parentHash,
                nonce: blockFound.nonce,
                sha3Uncles: blockFound.sha3Uncles,
                logsBloom: blockFound.logsBloom,
                transactionsRoot: blockFound.transactionsRoot,
                stateRoot: blockFound.stateRoot,
                receiptsRoot: blockFound.receiptsRoot,
                miner: blockFound.miner,
                difficulty: Number(blockFound.difficulty),
                totalDifficulty: Number(blockFound.totalDifficulty),
                extraData: blockFound.extraData,
                size: Number(blockFound.size),
                gasLimit: Number(blockFound.gasLimit),
                gasUsed: Number(blockFound.gasUsed),
                baseFeePerGas: Number(blockFound.baseFeePerGas),
                timestamp: Number(blockFound.timestamp) * 1000,
                transactions: blockFound.transactions,
            });
        } catch (ex) {
            Monitor.exception(ex);
            throw new Error("Unable to connect to the provider");
        }

        return result;
    }

    /**
     * Gets a block information by number
     * @param block The block number
     * @returns The block information
     */
    public async getBlockByNumber(block: number): Promise<Block> {
        let result: Block;
        try {
            const blockFound = await Web3RPCClient.getInstance().rpcRequest("eth_getBlockByNumber", ["" + block, false], { provider: BlockchainConfig.getInstance().provider });

            if (!blockFound) {
                return null;
            }

            result = ({
                number: Number(blockFound.number),
                hash: blockFound.hash,
                mixHash: blockFound.mixHash,
                parentHash: blockFound.parentHash,
                nonce: blockFound.nonce,
                sha3Uncles: blockFound.sha3Uncles,
                logsBloom: blockFound.logsBloom,
                transactionsRoot: blockFound.transactionsRoot,
                stateRoot: blockFound.stateRoot,
                receiptsRoot: blockFound.receiptsRoot,
                miner: blockFound.miner,
                difficulty: Number(blockFound.difficulty),
                totalDifficulty: Number(blockFound.totalDifficulty),
                extraData: blockFound.extraData,
                size: Number(blockFound.size),
                gasLimit: Number(blockFound.gasLimit),
                gasUsed: Number(blockFound.gasUsed),
                baseFeePerGas: Number(blockFound.baseFeePerGas),
                timestamp: Number(blockFound.timestamp) * 1000,
                transactions: blockFound.transactions,
            });
        } catch (ex) {
            Monitor.exception(ex);
            throw new Error("Unable to connect to the provider");
        }

        return result;
    }

    /**
     * Gets a transaction information by hash
     * @param txId The transaction hash
     * @returns The transaction information
     */
    public async getTransaction(txId: string): Promise<Transaction> {
        let result: Transaction;

        try {
            const transactionReceipt = await Web3RPCClient.getInstance().rpcRequest("eth_getTransactionByHash", [txId], { provider: BlockchainConfig.getInstance().provider });
            
            if(!transactionReceipt) {
                return null;
            }

            result = ({
                blockHash: transactionReceipt.blockHash,
                blockNumber: Number(transactionReceipt.blockNumber),
                chainId: transactionReceipt.chainId,
                from: transactionReceipt.from,
                gas: Number(transactionReceipt.gas),
                gasPrice: Number(transactionReceipt.gasPrice),
                maxPriorityFeePerGas: Number(transactionReceipt.maxPriorityFeePerGas),
                maxFeePerGas: Number(transactionReceipt.maxFeePerGas),
                hash: transactionReceipt.hash,
                input: transactionReceipt.input,
                nonce: transactionReceipt.nonce,
                to: transactionReceipt.to,
                transactionIndex: Number(transactionReceipt.transactionIndex),
                type: Number(transactionReceipt.type),
                value: Number(transactionReceipt.value),
                yParity: Number(transactionReceipt.yParity),
                v: transactionReceipt.v,
                r: transactionReceipt.r,
                s: transactionReceipt.s,
            });
        } catch (ex) {
            Monitor.exception(ex);
            throw new Error("Unable to connect to the provider");
        }

        return result;
    }

    /**
     * Gets the account information
     * @param address The account address
     * @returns The account information
     */
    public async getAccountInfo(address: string): Promise<AccountInformation> {

        let result: AccountInformation;

        try {
            const balance = await Web3RPCClient.getInstance().getBalance(address, "latest", { provider: BlockchainConfig.getInstance().provider });
            const totalTransactions = await Web3RPCClient.getInstance().rpcRequest("eth_getTransactionCount", [address, "latest"], { provider: BlockchainConfig.getInstance().provider });
            const code = await Web3RPCClient.getInstance().rpcRequest("eth_getCode", [address, "latest"], { provider: BlockchainConfig.getInstance().provider });

            result = {
                balance: Number(ethers.formatEther(balance)),
                totalTransactions: Number(totalTransactions),
                isContract: code !== "0x",
            }

        }catch(ex) {
            Monitor.exception(ex);
            throw new Error("Unable to connect to the provider");
        }

        return result;
    }
}
