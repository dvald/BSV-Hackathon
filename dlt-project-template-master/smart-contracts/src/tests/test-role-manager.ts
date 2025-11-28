// Test

"use strict";

import assert from "assert";
import { assertRevert, runTest, runTestCase } from "../utils/test-utils";
import { ROLES } from "./helpers/enums";
import { assertEvent } from "../utils/assert-event";
import { RoleManagerWrapper } from "../contract-wrappers/role-manager";
import { DeployedContracts } from "../contracts";
import { TestWallet } from "../utils/test-wallet";

/**
 * Test for the RoleManager smart contract
 * @param contracts The deployed contracts
 */
export async function testRoleManager(contracts: DeployedContracts) {
    // Prepare accounts

    const deployer = TestWallet.deployer();

    const account1 = TestWallet.random();
    const account2 = TestWallet.random();

    const roleManager = contracts.roleManager;

    await runTest("RoleManager", async () => {
        await runTestCase("Should give initial ADMIN role to deployer", async () => {
            const hasAdminRole = await roleManager.hasRole(deployer.address, ROLES.ADMIN);
            assert.equal(hasAdminRole, true);

            const hasAdminRolExplicit = await roleManager.hasRoleExplicit(deployer.address, ROLES.ADMIN);
            assert.equal(hasAdminRolExplicit, true);

            const isAdmin = await roleManager.isAdmin(deployer.address);
            assert.equal(isAdmin, true);
        });

        await runTestCase("A default account should not be able to change roles", async () => {
            const hasAdminRole = await roleManager.hasRole(account1.address, ROLES.ADMIN);
            assert.equal(hasAdminRole, false);

            const hasAdminRolExplicit = await roleManager.hasRoleExplicit(account1.address, ROLES.ADMIN);
            assert.equal(hasAdminRolExplicit, false);

            const isAdmin = await roleManager.isAdmin(account1.address);
            assert.equal(isAdmin, false);

            await assertRevert(
                roleManager.assignRole(account1.address, ROLES.ADMIN, account1.getTxOptions()),
                "A new account should not be able to change roles"
            );

            await assertRevert(
                roleManager.assignRole(account1.address, ROLES.TEST_ROLE, account1.getTxOptions()),
                "A new account should not be able to change roles"
            );

            await assertRevert(
                roleManager.revokeRole(deployer.address, ROLES.TEST_ROLE, account1.getTxOptions()),
                "A new account should not be able to change roles"
            );

            await assertRevert(
                roleManager.revokeRole(deployer.address, ROLES.ADMIN, account1.getTxOptions()),
                "A new account should not be able to change roles"
            );
        });

        await runTestCase("An administrator (ADMIN role) should be able to assign a role", async () => {
            let hasRole = await roleManager.hasRole(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRole, false);

            let hasRoleExplicit = await roleManager.hasRoleExplicit(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRoleExplicit, false);

            const result = await roleManager.assignRole(account1.address, ROLES.TEST_ROLE, deployer.getTxOptions());

            assertEvent(result, {
                contract: roleManager.address,
                abi: RoleManagerWrapper.abi(),
                eventName: "RoleAssigned",
                parameters: [account1.address, ROLES.TEST_ROLE, deployer.address],
            });

            hasRole = await roleManager.hasRole(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRole, true);

            hasRoleExplicit = await roleManager.hasRoleExplicit(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRoleExplicit, true);
        });

        await runTestCase("An administrator (ADMIN role) should be able to revoke a role", async () => {
            let hasRole = await roleManager.hasRole(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRole, true);

            let hasRoleExplicit = await roleManager.hasRoleExplicit(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRoleExplicit, true);

            const result = await roleManager.revokeRole(account1.address, ROLES.TEST_ROLE, deployer.getTxOptions());

            assertEvent(result, {
                contract: roleManager.address,
                abi: RoleManagerWrapper.abi(),
                eventName: "RoleRevoked",
                parameters: [account1.address, ROLES.TEST_ROLE, deployer.address],
            });

            hasRole = await roleManager.hasRole(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRole, false);

            hasRoleExplicit = await roleManager.hasRoleExplicit(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRoleExplicit, false);
        });

        await runTestCase("A role manager should be able to assign a role", async () => {
            await roleManager.assignRole(account2.address, ROLES.ROLE_MANAGER, deployer.getTxOptions());

            let hasRole = await roleManager.hasRole(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRole, false);

            let hasRoleExplicit = await roleManager.hasRoleExplicit(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRoleExplicit, false);

            const result = await roleManager.assignRole(account1.address, ROLES.TEST_ROLE, account2.getTxOptions());

            assertEvent(result, {
                contract: roleManager.address,
                abi: RoleManagerWrapper.abi(),
                eventName: "RoleAssigned",
                parameters: [account1.address, ROLES.TEST_ROLE, account2.address],
            });

            hasRole = await roleManager.hasRole(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRole, true);

            hasRoleExplicit = await roleManager.hasRoleExplicit(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRoleExplicit, true);

            const result2 = await roleManager.revokeRole(account1.address, ROLES.TEST_ROLE, account2.getTxOptions());

            assertEvent(result2, {
                contract: roleManager.address,
                abi: RoleManagerWrapper.abi(),
                eventName: "RoleRevoked",
                parameters: [account1.address, ROLES.TEST_ROLE, account2.address],
            });

            hasRole = await roleManager.hasRole(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRole, false);

            hasRoleExplicit = await roleManager.hasRoleExplicit(account1.address, ROLES.TEST_ROLE);
            assert.equal(hasRoleExplicit, false);
        });

        await runTestCase("A role manager should not be able to assign the ADMIN role", async () => {
            await assertRevert(
                roleManager.assignRole(account1.address, ROLES.ADMIN, account2.getTxOptions()),
                "Without the ADMIN role, an account should not be able to set the ADMIn role"
            );

            await assertRevert(
                roleManager.revokeRole(account1.address, ROLES.ADMIN, account2.getTxOptions()),
                "Without the ADMIN role, an account should not be able to set the ADMIn role"
            );

            await assertRevert(
                roleManager.revokeRole(deployer.address, ROLES.ADMIN, account2.getTxOptions()),
                "Without the ADMIN role, an account should not be able to set the ADMIn role"
            );
        });
    });
}