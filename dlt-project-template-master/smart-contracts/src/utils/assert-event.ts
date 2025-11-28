// Utility to asset events

"use strict";

import { ABILike, OutputABIParams, TransactionResult, Interface, Address, interpretLog, TransactionLog, JsonFragmentType, InputABIParams } from "@asanrom/smart-contract-wrapper";
import { compareAddresses, eventParameterToString } from "./blockchain";
import assert from "assert";

/**
 * Event assertion
 */
export type EventAssertion = {
    /**
     * Contract address
     */
    contract: Address;

    /**
     * ABI of the contract
     */
    abi: ABILike;

    /**
     * Event name
     */
    eventName: string;

    /**
     * Expected event parameters
     * (leave undefined or null in order to skip checking)
     */
    parameters: InputABIParams;
};

/**
 * Turns a transaction log into s string for debugging
 * @param log The log
 * @returns The debug string
 */
export function transactionLogToDebugString(log: TransactionLog): string {
    return `LOG #${log.logIndex.toString()} [ contract=${log.address} ] { Topics: ${JSON.stringify(log.topics.map(t => "0x" + t.toString("hex")))}, Data: "0x${log.data.toString("hex")}" }`;
}

function prepareEventInputsToCompare(inputs: readonly JsonFragmentType[], expectedParameters: InputABIParams, actualParameters: OutputABIParams): { expected: string[], actual: string[] } {
    const resExpected: string[] = [];
    const resActual: string[] = [];

    for (let i = 0; i < inputs.length; i++) {
        const expectedParam = expectedParameters[i];

        if (expectedParam === undefined || expectedParam === null) {
            continue;
        }

        const input = inputs[i];

        let expectedParamString = eventParameterToString(expectedParam);
        let actualParamString = eventParameterToString(actualParameters[i]);

        if (["address", "address[]", "bytes32", "bytes32[]", "bytes", "bytes[]"].includes(input.type)) {
            expectedParamString = expectedParamString.toLowerCase();
            actualParamString = actualParamString.toLowerCase();
        }

        resExpected.push(expectedParamString);
        resActual.push(actualParamString);
    }

    return {
        expected: resExpected,
        actual: resActual,
    };
}

/**
 * Asserts an event in a transaction
 * @param result The transaction result
 * @param assertion The event assertion
 */
export function assertEvent(result: TransactionResult<any>, assertion: EventAssertion) {
    const eventFound = assertion.abi.find(e => e.type === "event" && e.name === assertion.eventName);

    if (!eventFound) {
        throw new Error("Event not found in ABI: " + assertion.eventName);
    }

    const eventInputs = eventFound.inputs || [];

    const contractInterface = new Interface(assertion.abi);

    const logs = result.receipt.logs.filter(log => compareAddresses(log.address, assertion.contract));

    let matchError: Error;

    for (const log of logs) {
        const event = interpretLog(log, assertion.abi, contractInterface);

        if (!event || event.name !== assertion.eventName) {
            continue;
        }

        const { expected, actual } = prepareEventInputsToCompare(eventInputs, assertion.parameters, event.parameters);

        try {
            assert.equal(JSON.stringify(actual), JSON.stringify(expected), `Found ${assertion.eventName} event, but parameters do not match.`);

            return; // Found
        } catch (ex) {
            matchError = ex;
        }
    }

    if (matchError) {
        throw matchError;
    }

    throw new Error("Could not find any event named " + assertion.eventName + " for contract " + assertion.contract + " in the transaction receipt.");
}
