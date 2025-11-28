// Parallel transaction helper

"use strict";

import { TransactionSendingOptions } from "@asanrom/smart-contract-wrapper";
import { BlockchainConfig } from "../config/config-blockchain";
import { AsyncSemaphore } from "@asanrom/async-tools";

/**
 * Function to send a transaction (parallel)
 */
export type ParallelTxFunc = (getTxOptions: (pk?: Buffer) => TransactionSendingOptions) => Promise<void>;

/**
 * Runs parallel transactions, to speed them up
 * @param txFuncs The functions to send transactions
 */
export async function runParallelTransactions(txFuncs: ParallelTxFunc[]): Promise<void> {
    const sem = new AsyncSemaphore(1);

    let canRelease = false;

    const getTxOptions: (pk?: Buffer) => TransactionSendingOptions = pk => {
        return {
            ...BlockchainConfig.getInstance().getTransactionSendingOptions(pk),
            beforeSend: async () => {
                await sem.acquire();
                canRelease = true;
            },
            afterSend: () => {
                if (!canRelease) {
                    return;
                }
                canRelease = false;
                sem.release();
            },
        };
    };

    await Promise.all(txFuncs.map(txFuncs => txFuncs(getTxOptions)));
}
