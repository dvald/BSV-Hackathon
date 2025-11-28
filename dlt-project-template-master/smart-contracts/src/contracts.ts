// Smart contracts
// Add in this file the smart contracts that need to be deployed
// and also their initialization logic

"use strict";

import { TransactionSendingOptions } from "@asanrom/smart-contract-wrapper";
import { RoleManagerWrapper } from "./contract-wrappers/role-manager";
import { UpgradeControlWrapper } from "./contract-wrappers/upgrade-control";
import { GenericWrapper } from "./utils/proxy";
import { ExampleContractWrapper } from "./contract-wrappers/example-contract";
import { AsyncProvider } from "@asanrom/async-tools";
import { ExampleContract2Wrapper } from "./contract-wrappers/example-contract2";
import { getContractByteCode } from "./utils/bytecode";

/**
 * Object to contain the deployed contracts, as contract wrappers 
 */
export type DeployedContracts = {
    // UpgradeControl
    upgradeControl: UpgradeControlWrapper,

    // RoleManager
    roleManager: RoleManagerWrapper,

    // ExampleContract
    example: ExampleContractWrapper,

    // ExampleContract2
    example2: ExampleContract2Wrapper,
};

/**
 * Configuration for smart contracts in order
 * to deploy, initialize and upgrade them
 */
export const SMART_CONTRACTS: DeployedContractsConfig = {
    upgradeControl: {
        contractName: "UpgradeControl",
        wrapper: UpgradeControlWrapper,
        initialize: async (contracts, getTxOptions) => {
            await contracts.upgradeControl.initialize(contracts.roleManager.address, getTxOptions());
        },
    },
    roleManager: {
        contractName: "RoleManager",
        wrapper: RoleManagerWrapper,
        initialize: async (contracts, getTxOptions) => {
            await contracts.roleManager.initialize(contracts.upgradeControl.address, getTxOptions());
        },
    },
    example: {
        contractName: "ExampleContract",
        wrapper: ExampleContractWrapper,
        initialize: async (contracts, getTxOptions) => {
            await contracts.example.initialize(
                contracts.roleManager.address,
                contracts.upgradeControl.address,
                getTxOptions()
            );
        },
    },
    example2: {
        contractName: "ExampleContract2",
        wrapper: ExampleContract2Wrapper,
        deploy: async (pendingContracts, getTxOptions) => {
            // This is an example of a custom deployment
            // of a contract with a dependency in the constructor

            const exampleContract = await pendingContracts.example.getValue();

            const exampleContract2 = await ExampleContract2Wrapper.deploy(
                exampleContract.address, 
                getContractByteCode("ExampleContract2"),
                getTxOptions(),
            );

            return exampleContract2;
        },
        notUpgradeable: true,
    },
};

/**
 * Type to include async providers in the deployment phase
 */
export type PendingDeployedContracts = { [K in keyof DeployedContracts]: AsyncProvider<DeployedContracts[K]> };

/**
 * Configuration for a smart contract
 */
export type DeployedContractsConfig = {
    [K in keyof DeployedContracts]: {
        /**
         * The name of the contract
         */
        contractName: string,

        /**
         * The wrapper of the contract
         */
        wrapper: GenericWrapper<DeployedContracts[K]>,

        /**
         * A function to deploy the smart contract (optional)
         * If not provided, a generic function will be used instead
         * @param pendingContracts The pending deploying contracts. You can wait for the values if you contract has a dependency on other contract in the constructor parameters.
         * @param getTxOptions Function you can call to obtain the transaction options, when sending transactions
         * @returns The wrapper of the deployed smart contract
         */
        deploy?: (pendingContracts: PendingDeployedContracts, getTxOptions: (pk?: Buffer) => TransactionSendingOptions) => Promise<DeployedContracts[K]>,

        /**
         * A function to initialize the smart contract (optional)
         * @param contracts The deployed contracts
         * @param getTxOptions Function you can call to obtain the transaction options, when sending transactions
         */
        initialize?: (contracts: DeployedContracts, getTxOptions: (pk?: Buffer) => TransactionSendingOptions) => Promise<void>,

        /**
         * True if the smart contract cannot be upgraded (so it is skipped when upgrading)
         */
        notUpgradeable?: boolean,

        /**
         * A function to upgrade the smart contract (optional)
         * If not provided, a generic function will be used instead
         * @param contracts The deployed contracts
         * @param getTxOptions Function you can call to obtain the transaction options, when sending transactions
         */
        upgrade?: (contracts: DeployedContracts, getTxOptions: (pk?: Buffer) => TransactionSendingOptions) => Promise<void>,

        /**
         * Set it to true in order to skip the contract from the generated documentation
         */
        skipFromDocumentation?: boolean,

        /**
         * Set it to true in order to generate a bytecode file in the backend
         * The bytecode file is necessary to deploy instances of the smart contract in the backend
         */
        generateBytecodeFile?: boolean;
    }
}
