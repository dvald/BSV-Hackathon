// Blockchain utils

"use strict";

import Crypto from "crypto";
import { hexWithPrefix, InputABIParam, OutputABIParam } from "@asanrom/smart-contract-wrapper";

/**
 * Zero address
 */
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Turns address into standard format
 * @param addr The address
 * @returns The normalized address
 */
export function normalizeAddress(addr: string): string {
    return hexWithPrefix(addr).toLowerCase();
}

/**
 * Compares two addresses
 * @param addr1 Address 1
 * @param addr2 Address 2
 * @returns True if the address are equal
 */
export function compareAddresses(addr1: string, addr2: string): boolean {
    return normalizeAddress(addr1) === normalizeAddress(addr2);
}

/**
 * Checks if an address is the zero address
 * @param addr The address
 * @returns True if the address is the zero address
 */
export function isZeroAddress(addr: string): boolean {
    return compareAddresses(ZERO_ADDRESS, addr);
}

/**
 * Turns event output parameter to string
 * @param param The parameter value
 * @returns The stringified value
 */
export function eventParameterToString(param: OutputABIParam | InputABIParam): string {
    if (typeof param === "object") {
        if (Array.isArray(param)) {
            return JSON.stringify(param.map(eventParameterToString));
        } else if (param instanceof Buffer) {
            return "0x" + param.toString("hex");
        } else {
            return param + "";
        }
    } else {
        return param + "";
    }
}

/**
 * Validates an Ethereum address
 * @param addr The address 
 * @returns True if the address is valid
 */
export function validateAddress(addr: string): boolean {
    return ((/^0x[0-9a-f]{40}$/i).test(hexWithPrefix(addr)));
}

/**
 * Creates random bytes32 value
 * @returns The random bytes32 value
 */
export function randomBytes32(): string {
    return "0x" + Crypto.randomBytes(32).toString("hex").toLowerCase();
}
