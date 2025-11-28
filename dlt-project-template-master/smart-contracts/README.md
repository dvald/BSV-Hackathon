# Smart contracts

This folder contains the smart contracts and all the necessary tools to compile, deploy and test them.

## Requirements

- [NodeJS](https://nodejs.org/) - Last stable version

## Installation

In order to install the dependencies, run:

```sh
npm install
```

## Configuration

In order to configure the project, copy the file `.env.example` into `.env`.

```sh
cp .env.example .env
```

Open the `.env` file with an editor and modify the appropriate environment variables.

For development, you can use the default configuration.

Production network configuration:

| Variable name              | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `BLOCKCHAIN_NODE_PROTOCOL` | Protocol to connect to the node via JSON-RPC     |
| `BLOCKCHAIN_NODE_RPC_URL`  | URL of the JSON RPC endpoint of the node.        |
| `DEPLOY_PRIVATE_KEY`       | Private key to use to deploy the smart contracts |

Test network configuration:

| Variable name                   | Description                                      |
| ------------------------------- | ------------------------------------------------ |
| `TEST_BLOCKCHAIN_NODE_PROTOCOL` | Protocol to connect to the node via JSON-RPC     |
| `TEST_BLOCKCHAIN_NODE_RPC_URL`  | URL of the JSON RPC endpoint of the node.        |
| `TEST_DEPLOY_PRIVATE_KEY`       | Private key to use to deploy the smart contracts |

Log config

| Variable name | Description                                            |
| ------------- | ------------------------------------------------------ |
| `LOG_DEBUG`   | Set it to `YES` to log debug messages                  |
| `LOG_TRACE`   | Set it to `YES` to log trace messages for transactions |

## Compiling the smart contracts

In order to compile the smart contracts simply run:

```sh
npm run build
```

The Solidity compiler will compile the contracts and generate the compiled artifacts in the `build` folder.

This script will generate a wrapper in the `src/contract-wrappers` folder. You can copy this wrapper into your web application backend codebase in order to use it.

## Deploying

In order to deploy the smart contracts, run:

```sh
npm run deploy
```

If you already deployed the smart contracts and you want to upgrade them, run:

```sh
npm run deploy:upgrade
```

## Testing

In order to run the test, type:

```
npm test
```

This will run the test in the test network. Make sure it's up and running before you run the tests.

## Development documentation

This section contains the development documentation for the project.

### Source code location

You can find the source code of the smart contracts in the [contracts](./contracts) folder. They are written in [Solidity](https://soliditylang.org/).

You can find the tests and the deployment / initialization / upgrade logic for the smart contracts in the [](). It is written in [TypeScript](https://www.typescriptlang.org/), using the [smart-contract-wrapper](https://github.com/AgustinSRG/smart-contract-wrapper) library in order to interact with the smart contracts.

### Configuring smart contracts to be deployed

When adding or removing smart contracts, or changing the initialization logic, you must edit the [src/contracts.ts](./src/contracts.ts) file.

The type `DeployedContracts` must contain a key for each contract that should be deployed, mapped to the corresponding smart contract wrapper.

Also, for each key in `DeployedContracts`, an entry must be added to the `SMART_CONTRACTS` object, each one containing:

- `contractName` - The contract name, in order to find its bytecode and ABI
- `wrapper` - The contract wrapper, in order to instantiate it
- `deploy` - Optional. A function to deploy the smart contract, and return an instance of the wrapper. If not provided, the contract is deployed using the `ERC1967` proxy, assuming is upgradeable. If you provide it, make sure to use the [getContractByteCode](./src/utils/byecode.ts) function in order to fetch the compiled contract bytecode.
- `initialize` - Optional. A function to call after all contracts are deployed in order to initialize the smart contract. For upgradeable contracts, this is the preferred approach. An empty constructor and an initializer function.
- `notUpgradeable` - Optional. By default, all contracts are assumed upgradeable. If this is set to `true`, the contract is assumed not upgradeable, so it will be skipped in the upgrade process.
- `upgrade` - Optional. A custom function to upgrade the smart contract. If no provided, the smart contract will be upgraded using the `UpgradeControl` smart contract.
- `skipFromDocumentation` - Optional. Set it to `true` to prevent including the contract in the generated documentation.
- `generateBytecodeFile` - Optional. Set it to `true` in order to generate a file in the backend with the contract bytecode, in order to deploy instances of the contract from the backend.

### Tests

All the tests of the smart contracts are stored into the [src/tests](./tests/) folder.

In order to add a test, create a new file in the [src/tests](./tests/) folder. You can use the [RoleManager test](./tests/test-role-manager.ts) as a template.

Update the test function to match your test cases.

Also update [src/tests/index.ts](./tests/index.ts) to add its execution in the test flow.

The project contains some utility functions and classes you can use to simplify the test code:

| Name             | Type     | File                                                     | Description                                                                                                                                                                                  |
| ---------------- | -------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runTest`        | Function | [src/utils/test-utils.ts](./src/utils/test-utils.ts)     | Runs a test, logging the name of the test.                                                                                                                                                   |
| `runTestCase`    | Function | [src/utils/test-utils.ts](./src/utils/test-utils.ts)     | Runs a test case, marking it as passed of failed automatically. It should be used inside the `runTest` callback                                                                              |
| `assertFailure`  | Function | [src/utils/test-utils.ts](./src/utils/test-utils.ts)     | Ensures an async function fails (throws an error). Useful to ensure a function should fail.                                                                                                  |
| `assertRevert`   | Function | [src/utils/test-utils.ts](./src/utils/test-utils.ts)     | Ensures that a transaction is reverted. Useful to ensure a transaction fails. More specific than `assertFailure`                                                                             |
| `assertEqualHex` | Function | [src/utils/test-utils.ts](./src/utils/test-utils.ts)     | Ensures that two hexadecimal values are equal. This is useful to prevent false mismatches due to hex values being in different cases (lowercase vs uppercase, but same value).               |
| `assertEvent`    | Function | [src/utils/assert-event.ts](./src/utils/assert-event.ts) | Ensures that a transaction emitted an event and the event parameters are the same as expected.                                                                                               |
| `logDebug`       | Function | [src/utils/log-debug.ts](./src/utils/log-debug.ts)       | Logs a debug message only if debug messages are enabled.                                                                                                                                     |
| `TestWallet`     | Class    | [src/utils/test-wallet.ts](./src/utils/test-wallet.ts)   | A class you can use to obtain or generate wallets to use for testing. Each wallet has its `key` and `address`, and also the `getTxOptions` method to obtain the transaction sending options. |
