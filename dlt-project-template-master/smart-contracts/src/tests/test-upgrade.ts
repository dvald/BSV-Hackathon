// Test

"use strict";

import { SimpleStorageWrapper } from "../contract-wrappers/test/simple-storage";
import { SimpleStorageV2Wrapper } from "../contract-wrappers/test/simple-storage-v2";
import { UpgradeControlWrapper } from "../contract-wrappers/upgrade-control";
import { assertEvent } from "../utils/assert-event";
import { getContractByteCode } from "../utils/bytecode";
import { deployProxiedContract } from "../utils/proxy";
import { runTest, runTestCase } from "../utils/test-utils";
import assert from "assert";
import { TestWallet } from "../utils/test-wallet";
import { DeployedContracts } from "../contracts";

/**
 * This is the main test for the contract: UpgradeControl
 * This test deploys an initial SimpleStorage and later Upgrades to SimpleStorageV2
 * The contracts both have a version() pure function to distinguish them
 * @param contracts Deployed smart contracts
 */
export async function testUpgradeSmartContract(contracts: DeployedContracts) {
    const deployerWallet = TestWallet.deployer();

    await runTest("UpgradeControl", async () => {
        let proxiedSimpleStorage: SimpleStorageWrapper;

        await runTestCase("Deploy and initialize proxied SimpleStorage", async () => {
            proxiedSimpleStorage = await deployProxiedContract("SimpleStorage", getContractByteCode("SimpleStorage", "test"), SimpleStorageWrapper, deployerWallet.getTxOptions());

            await proxiedSimpleStorage.initialize(contracts.roleManager.address, contracts.upgradeControl.address, deployerWallet.getTxOptions());

            const version = await proxiedSimpleStorage.version();

            assert.equal(
                version,
                BigInt(1),
                "Version does not match"
            );
        });

        const testValue = 177; // A test value to be stored

        await runTestCase("Store value in SimpleStorage for later check", async () => {
            const result = await proxiedSimpleStorage.setValue(testValue, deployerWallet.getTxOptions());

            assertEvent(result, {
                contract: proxiedSimpleStorage.address,
                abi: SimpleStorageWrapper.abi(),
                eventName: "StoredValue",
                parameters: [testValue],
            });

            const value = await proxiedSimpleStorage.getValue();

            assert.equal(
                value,
                BigInt(testValue),
                "Value does not match"
            );
        });

        let v2: SimpleStorageV2Wrapper;

        await runTestCase("Deploy new implementation (SimpleStorageV2)", async () => {
            v2 = await SimpleStorageV2Wrapper.deploy(getContractByteCode("SimpleStorageV2", "test"), deployerWallet.getTxOptions());
        });

        await runTestCase("Upgrade to the new implementation", async () => {
            const result = await contracts.upgradeControl.upgradeContract(proxiedSimpleStorage.address, v2.address, deployerWallet.getTxOptions());

            assertEvent(result, {
                contract: proxiedSimpleStorage.address,
                abi: SimpleStorageWrapper.abi(),
                eventName: "Upgraded",
                parameters: [v2.address],
            });

            assertEvent(result, {
                contract: contracts.upgradeControl.address,
                abi: UpgradeControlWrapper.abi(),
                eventName: "ContractUpgraded",
                parameters: [proxiedSimpleStorage.address, v2.address],
            });

            // Check that version changed

            const version = await proxiedSimpleStorage.version();

            assert.equal(
                version,
                BigInt(2),
                "Version does not match"
            );
        });

        await runTestCase("After upgrade, the contract should preserve its data", async () => {
            const value = await proxiedSimpleStorage.getValue();

            assert.equal(
                value,
                BigInt(testValue),
                "Value does not match"
            );
        });
    });
}
