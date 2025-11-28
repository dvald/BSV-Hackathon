// Test

"use strict";

import { DeployedContracts } from "../contracts";
import { assertEqualHex, runTest, runTestCase } from "../utils/test-utils";

/**
 * Test for the ExampleContract2 smart contract
 * @param contracts The deployed contracts
 */
export async function testExampleContract2(contracts: DeployedContracts) {
    await runTest("ExampleContract2", async () => {
        await runTestCase("Should provide the correct ExampleContract address", async () => {
            const address = await contracts.example2.getExampleContractAddress();

            assertEqualHex(address, contracts.example.address);
        });
    });
}
