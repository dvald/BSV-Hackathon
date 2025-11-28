// Test

"use strict";

import assert from "assert";
import { DeployedContracts } from "../contracts";
import { assertEqualHex, assertRevert, runTest, runTestCase } from "../utils/test-utils";
import { TestWallet } from "../utils/test-wallet";
import { ROLES } from "./helpers/enums";
import { assertEvent } from "../utils/assert-event";
import { ExampleContractWrapper } from "../contract-wrappers/example-contract";

/**
 * Test for the ExampleContract smart contract
 * @param contracts The deployed contracts
 */
export async function testExampleContract(contracts: DeployedContracts) {
    // Prepare accounts

    const deployer = TestWallet.deployer();
    const testWallet = TestWallet.named("test-wallet");

    const testAccount1 = TestWallet.random();

    await runTest("ExampleContract", async () => {
        // Give the role
        await contracts.roleManager.assignRole(testWallet.address, ROLES.TEST_ROLE, deployer.getTxOptions());

        const exampleValue1 = BigInt(123);
        const exampleValue2 = "Example value string";
        const exampleValue3 = testAccount1.address;

        await runTestCase("Should be able to set the example values", async () => {
            const result = await contracts.example.setTestValues(
                exampleValue1,
                exampleValue2,
                exampleValue3,
                testWallet.getTxOptions(),
            );

            assertEvent(result, {
                contract: contracts.example.address,
                abi: ExampleContractWrapper.abi(),
                eventName: "TestEvent",
                parameters: [exampleValue1, exampleValue2, exampleValue3],
            });
        });

        await runTestCase("Should not be able to set the example values without the role", async () => {
            await assertRevert(
                contracts.example.setTestValues(
                    exampleValue1,
                    exampleValue2,
                    exampleValue3,
                    testAccount1.getTxOptions(),
                ),
                "An account without the appropriate role should not be able to call this method",
            );
        });

        await runTestCase("Should be able to fetch the example values", async () => {
            const exampleValues = await contracts.example.getTestValues();

            assert.equal(exampleValues.exampleValue1, exampleValue1);
            assert.equal(exampleValues.exampleValue2, exampleValue2);
            assertEqualHex(exampleValues.exampleValue3, exampleValue3);
        });
    });
}
