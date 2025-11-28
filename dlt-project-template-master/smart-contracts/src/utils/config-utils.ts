// Configuration utils

"use strict";

function isUpper(c: string): boolean {
    return c.toUpperCase() === c;
}

/**
 * Gets the env variable name for the specific smart contract
 * @param contractKey The contract key in the DeployedContracts object 
 * @returns The name of the env variable to hold the contract address
 */
export function contractKeyToConfigKey(contractKey: string): string {
    let result = "";

    let prevLower = true;

    for (let i = 0; i < contractKey.length; i++) {
        const c = contractKey.charAt(i);

        if (isUpper(c) && prevLower) {
            result += "_";
        }

        result += c.toUpperCase();

        prevLower = !isUpper(c);
    }

    return "CONTRACT_" + result;
}
