// Contract upgrade process

"use strict";

require('dotenv').config();

import Path from "path";
import FS from "fs";
import { DeployedContracts, SMART_CONTRACTS } from "./contracts";
import { contractKeyToConfigKey } from "./utils/config-utils";
import { validateAddress } from "./utils/blockchain";
import { BlockchainConfig } from "./config/config-blockchain";
import { ParallelTxFunc, runParallelTransactions } from "./utils/tx-parallel";
import { getContractByteCode } from "./utils/bytecode";
import { deployProxiedContract } from "./utils/proxy";
import { BackendEnvFileEntry, updateBackendEnvFile } from "./backend-env-update";
import { deploySmartContract } from "@asanrom/smart-contract-wrapper";
import { logDebug } from "./utils/log-debug";

async function main() {
    const backendEnvFile = Path.resolve(__dirname, "..", "..", "web-application", "backend", ".env");

    if (!FS.existsSync(backendEnvFile)) {
        const exampleEnvFile = Path.resolve(__dirname, "..", "..", "web-application", "backend", ".env.example");

        FS.writeFileSync(backendEnvFile, FS.readFileSync(exampleEnvFile).toString());

        console.log("Backend .env file not found, created new one with the contents of .env.example");
    }

    const configEntriesMap = new Map<string, string>();

    for (const key of Object.keys(SMART_CONTRACTS)) {
        configEntriesMap.set(contractKeyToConfigKey(key), key);
    }

    // Find the addresses of the deployed smart contracts frm the backend .env file

    const contracts: DeployedContracts = Object.create(null);

    const dotEnvLines = FS.readFileSync(backendEnvFile).toString().split("\n");

    for (let line of dotEnvLines) {
        line = line.trim();

        if (!line || !line.includes("=")) {
            continue;
        }

        const parts = line.split("=");
        const varName = parts[0];
        const varValue = parts.slice(1).join("=").trim();

        if (!configEntriesMap.has(varName) || !validateAddress(varValue)) {
            continue;
        }

        const contractKey = configEntriesMap.get(varName);
        const wrapper = SMART_CONTRACTS[contractKey].wrapper;

        contracts[contractKey] = new wrapper(varValue, BlockchainConfig.getInstance().getRpcOptions());
    }

    console.log("------------------------------------------");
    console.log("Ethereum node: " + BlockchainConfig.getInstance().url);
    console.log("Deployer: " + BlockchainConfig.getInstance().deployAccountAddress);
    console.log("------------------------------------------");

    // ----------------------------------------------------------
    // Deploy
    // ----------------------------------------------------------

    const deploymentFuncs: ParallelTxFunc[] = [];
    const contractsToInitialize = new Set<string>();

    for (const contractKey of Object.keys(SMART_CONTRACTS)) {
        if (contracts[contractKey]) {
            continue; // Already deployed
        }

        contractsToInitialize.add(contractKey);

        const contractConfig = SMART_CONTRACTS[contractKey];

        if (contractConfig.deploy) {
            deploymentFuncs.push(async getTxOptions => {
                const wrapper = await contractConfig.deploy(getTxOptions);
                contracts[contractKey] = wrapper;
            });
        } else {
            // Generic deployment (proxied)
            const bytecode = getContractByteCode(contractConfig.contractName);
            deploymentFuncs.push(async getTxOptions => {
                const wrapper = await deployProxiedContract(contractConfig.contractName, bytecode, contractConfig.wrapper, getTxOptions());
                contracts[contractKey] = wrapper;
            });
        }
    }

    if (deploymentFuncs.length > 0) {
        console.log("Deploying missing smart contracts...");
        await runParallelTransactions(deploymentFuncs);
    } else {
        console.log("No new smart contracts to deploy.");
    }

    // ----------------------------------------------------------
    // Initialize
    // ----------------------------------------------------------

    const initializeFuncs: ParallelTxFunc[] = [];

    for (const contractKey of Object.keys(SMART_CONTRACTS)) {
        if (!contractsToInitialize.has(contractKey)) {
            continue; // Already initialized
        }

        const contractConfig = SMART_CONTRACTS[contractKey];

        if (contractConfig.initialize) {
            initializeFuncs.push(async getTxOptions => {
                await contractConfig.initialize(contracts, getTxOptions);
            });
        }
    }

    if (initializeFuncs.length > 0) {
        console.log("Initializing smart contracts...");
        await runParallelTransactions(initializeFuncs);
    } else {
        console.log("No new smart contracts to initialize");
    }

    // ----------------------------------------------------------
    // Upgrade
    // ----------------------------------------------------------

    const upgradeControl = contracts.upgradeControl;
    const upgradeFuncs: ParallelTxFunc[] = [];

    for (const contractKey of Object.keys(SMART_CONTRACTS)) {
        if (contractsToInitialize.has(contractKey)) {
            continue; // This contract was deployed and initialized, upgrade not needed
        }

        const contractConfig = SMART_CONTRACTS[contractKey];

        if (contractConfig.notUpgradeable) {
            continue; // Not upgradeable
        }

        if (contractConfig.upgrade) {
            upgradeFuncs.push(async getTxOptions => {
                await contractConfig.upgrade(contracts, getTxOptions);
            });
        } else {
            const bytecode = getContractByteCode(contractConfig.contractName);
            const proxyAddress = contracts[contractKey].address;

            upgradeFuncs.push(async getTxOptions => {
                // Deploy new implementation contract
                logDebug(`Deploying new implementation for ${contractConfig.contractName}`);
                const newImplementation = await deploySmartContract(bytecode, [], [], 0, getTxOptions());

                // Upgrade
                logDebug(`Upgrading ${contractConfig.contractName} implementation to ${newImplementation.result}`);
                await upgradeControl.upgradeContract(proxyAddress, newImplementation.result, getTxOptions());
            });
        }
    }

    if (upgradeFuncs.length > 0) {
        console.log("Upgrading smart contracts...");
        await runParallelTransactions(upgradeFuncs);
    } else {
        console.log("No smart contracts to upgrade");
    }

    // ----------------------------------------------------------
    // Print final configuration
    // ----------------------------------------------------------

    console.log("------------------------------------------");
    console.log("Done. Printing final configuration...");
    console.log("------------------------------------------");
    console.log("");

    console.log("### Smart contracts ###");
    console.log("");

    const backendEnvEntries: BackendEnvFileEntry[] = [];

    for (const key of Object.keys(contracts)) {
        const configKeyName = contractKeyToConfigKey(key);
        console.log(`${configKeyName}=${contracts[key].address}`);
        console.log("");

        backendEnvEntries.push({
            name: `${configKeyName}`,
            value: contracts[key].address,
        });
    }

    console.log("------------------------------------------");
    console.log("");

    updateBackendEnvFile(backendEnvEntries);
}

main().catch(function (ex) {
    console.error(ex);
    process.exit(1);
});

