// Util to get the bytecode of a contract

"use strict";

import Path from "path";
import FS from "fs";

/**
 * Reads the bytecode of a contract
 * @param name The name of the contract
 */
export function getContractByteCode(name: string, subFolder?: string): Buffer {
    const buildPath = Path.resolve(__dirname, "..", "..", "build", (subFolder ? (subFolder + "_") : "") + name + "_sol_" + name + ".bin");

    let bytecode: Buffer;

    try {
        bytecode = Buffer.from(FS.readFileSync(buildPath).toString(), "hex");
    } catch (ex) {
        console.error(ex);
        console.log("Error reading the bytecode of " + name + ". Make sure you compiled the smart contracts. Also make sure the name of the contract is correct.");
        process.exit(1);
    }

    return bytecode;
}
