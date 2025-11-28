// Test utils

import assert from "assert";
import { hexWithPrefix, TransactionResult } from "@asanrom/smart-contract-wrapper";
import { logDebug } from "./log-debug";

const TestStatus = {
    indentation: 0,
};

// Gets indentation for tests
function getIndentation(): string {
    let res = "";

    for (let i = 0; i < TestStatus.indentation; i++) {
        res += "    ";
    }

    return res;
}

/**
 * Marks test as started
 * @param name The test name
 */
export function markTestStart(name: string) {
    console.log(`${getIndentation()}🧪  ${name}`);
    TestStatus.indentation++;
}

/**
 * Marks test as ended
 */
export function markTestEnd() {
    console.log("");
    TestStatus.indentation--;
}

/**
 * Marks test as passed
 * @param msg The test message
 */
export function markPassed(msg: string) {
    console.log(`${getIndentation()}✔️  ${msg}`);
}

/**
 * Marks test as failed
 * @param msg The test message
 */
export function markFailed(msg: string) {
    console.log(`${getIndentation()}❌  ${msg}`);
}

/**
 * Runs test
 * @param name The test name
 * @param testFunc The function to run
 */
export async function runTest(name: string, testFunc: () => Promise<void>): Promise<void> {
    markTestStart(name);

    try {
        await testFunc();
    } catch (ex) {
        console.error(ex);
        process.exit(1);
    }

    markTestEnd();
}

/**
 * Runs test case
 * @param msg The test message
 * @param testFunc The function to run
 */
export async function runTestCase(msg: string, testFunc: () => Promise<void>): Promise<void> {
    try {
        await testFunc();
    } catch (ex) {
        console.error(ex);
        markFailed(msg);
        process.exit(1);
    }

    markPassed(msg);
}

/**
 * Asserts that a promise will fail
 * @param promiseToFailCheck The promise to check
 * @param messageIfNoError The error message in case of no error
 */
export async function assertFailure(promiseToFailCheck: Promise<any>, messageIfNoError?: string): Promise<void> {
    try {
        await promiseToFailCheck;
    } catch (ex) {
        logDebug("Expected failure with message: " + ex.message);
        return;
    }

    throw new Error(messageIfNoError || "Expected failure, but no error was thrown.");
}

/**
 * Asserts that a transaction will revert
 * @param promiseToFailCheck The promise to send the transaction
 * @param messageIfNoError The error message in case of no error
 */
export async function assertRevert(promiseToFailCheck: Promise<TransactionResult<any>>, messageIfNoError?: string): Promise<void> {
    try {
        await promiseToFailCheck;
    } catch (ex) {
        if (!ex.message.toLowerCase().includes("execution reverted")) {
            throw ex;
        }
        logDebug("Expected failure with message: " + ex.message);
        return;
    }

    throw new Error(messageIfNoError || "Expected failure, but no error was thrown.");
}

/**
 * Asserts two hex values are equal
 * @param hex1 The hex value 1
 * @param hex2 The hex value 2
 * @param message The custom error message
 */
export function assertEqualHex(hex1: string, hex2: string, message?: string) {
    assert.equal(
        hexWithPrefix(hex1).toLowerCase(),
        hexWithPrefix(hex2).toLowerCase(),
        message,
    );
}
