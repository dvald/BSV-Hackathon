// Test wallets

"use strict";

import { privateKeyToAddress, TransactionSendingOptions } from "@asanrom/smart-contract-wrapper";
import Crypto from "crypto";
import { BlockchainConfig } from "../config/config-blockchain";

/**
 * Test wallet
 */
export class TestWallet {
    /**
     * Generates a random wallet for testing
     * @returns The wallet
     */
    public static random(): TestWallet {
        const key = Crypto.randomBytes(32);
        return new TestWallet(key);
    }

    /**
     * Obtains the deployer wallet
     * @returns The wallet
     */
    public static deployer(): TestWallet {
        return new TestWallet(BlockchainConfig.getInstance().deployPrivateKey);
    }

    private static namedWallets: Map<string, TestWallet> = new Map();

    /**
     * Gets a named wallet (it will be the same between tests)
     * @param name The wallet name
     * @returns The wallet
     */
    public static named(name: string): TestWallet {
        if (TestWallet.namedWallets.has(name)) {
            return TestWallet.namedWallets.get(name);
        }

        const wallet = TestWallet.random();

        TestWallet.namedWallets.set(name, wallet);

        return wallet;
    }

    // Private key
    public key: Buffer;

    // Address
    public address: string;

    /**
     * Builds a test wallet
     * @param key The wallet private key
     */
    constructor(key: Buffer) {
        this.key = key;
        this.address = privateKeyToAddress(key);
    }

    /**
     * Gets the options to send transactions
     * @returns The transaction sending options
     */
    public getTxOptions(): TransactionSendingOptions {
        return BlockchainConfig.getInstance().getTransactionSendingOptions(this.key);
    }
}
