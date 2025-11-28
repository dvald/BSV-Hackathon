// Entry point of the tests

"use strict";

import { BlockchainConfig } from "../config/config-blockchain";
import { deploySmartContracts } from "../contract-deployment";
import { markPassed } from "../utils/test-utils";
import { testExampleContract } from "./test-example-contract";
import { testExampleContract2 } from "./test-example-contract-2";
import { testRoleManager } from "./test-role-manager";
import { testUpgradeSmartContract } from "./test-upgrade";

/**
 * Run the tests
 */
export async function runContractTests() {
    BlockchainConfig.IS_TEST = true;

    // Deploy smart contracts
    const contracts = await deploySmartContracts();

    markPassed("Contracts deployed" + "\n");

    // Run tests

    await testRoleManager(contracts);

    await testUpgradeSmartContract(contracts);

    await testExampleContract(contracts);

    await testExampleContract2(contracts);

    // Finalize

    markPassed("All tests passed");
}
