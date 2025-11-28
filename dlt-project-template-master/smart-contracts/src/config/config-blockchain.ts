// Reserved for license

"use strict";

import { RPCOptions, RPCProvider, RPC_HTTP_Provider, RPC_WebSocket_Provider, TransactionSendingOptions, hexNoPrefix, privateKeyToAddress } from "@asanrom/smart-contract-wrapper";

/**
 * Blockchain configuration.
 */
export class BlockchainConfig {
    /**
     * Set it to true for test
     */
    public static IS_TEST = false;


    /**
     * Gets the configuration instance.
     */
    public static getInstance(): BlockchainConfig {
        if (BlockchainConfig.instance) {
            return BlockchainConfig.instance;
        }

        const config: BlockchainConfig = new BlockchainConfig();

        const protocol = BlockchainConfig.IS_TEST ? (process.env.TEST_BLOCKCHAIN_NODE_PROTOCOL || "http") : (process.env.BLOCKCHAIN_NODE_PROTOCOL || "http");
        const urlEnv = BlockchainConfig.IS_TEST ? process.env.TEST_BLOCKCHAIN_NODE_RPC_URL : process.env.BLOCKCHAIN_NODE_RPC_URL;

        switch (protocol) {
            case "http":
            case "https":
                config.protocol = "http";
                config.url = urlEnv || "http://localhost:8545";
                config.provider = new RPC_HTTP_Provider(config.url);
                break;
            case "ws":
            case "wss":
                config.protocol = "ws";
                config.url = urlEnv || "ws://localhost:8546";
                config.provider = new RPC_WebSocket_Provider(config.url);
                break;
            default:
                throw new Error("Invalid protocol: " + config.protocol + " | Allowed protocols for blockchain connections: http, ws");
        }

        const pkEnv = BlockchainConfig.IS_TEST ? process.env.TEST_DEPLOY_PRIVATE_KEY : process.env.DEPLOY_PRIVATE_KEY;

        config.deployPrivateKey = Buffer.from(hexNoPrefix(pkEnv || "25C274B819D134AC7826A83637E34BA9E959BC859F991A2EDB58E801B1219217"), "hex");

        if (config.deployPrivateKey.length !== 32) {
            throw new Error("Invalid DEPLOY_PRIVATE_KEY provided (Not 32 bytes key).");
        }

        config.deployAccountAddress = privateKeyToAddress(config.deployPrivateKey);

        config.logDebug = process.env.LOG_DEBUG === "YES";

        config.logTrace = process.env.LOG_TRACE === "YES";

        BlockchainConfig.instance = config;

        return config;
    }
    private static instance: BlockchainConfig = null;

    public protocol: "http" | "ws";
    public url: string;

    public provider: RPCProvider;

    public deployPrivateKey: Buffer;

    public deployAccountAddress: string;

    public logDebug: boolean;

    public logTrace: boolean;

    /**
     * Gets options for transaction sending
     * @param pk Private key
     * @returns The options
     */
    public getTransactionSendingOptions(pk?: Buffer): TransactionSendingOptions {
        return {
            provider: this.provider,
            privateKey: pk || this.deployPrivateKey,
            logFunction: msg => {
                if (!this.logTrace) {
                    return;
                }
                console.log("[TRACE] [TX] " + msg);
            },
        };
    }

    /**
     * Gets options for RPC
     * @returns The options
     */
    public getRpcOptions(): RPCOptions {
        return {
            provider: this.provider,
        };
    }
}
