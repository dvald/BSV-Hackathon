// ExampleContract contract wrapper

"use strict";

import { BytesLike, TransactionSendingOptions, deploySmartContract, getTxBuildDetailsForDeploy, Quantity, SmartContractEventWrapper, SmartContractEvent, Address, MethodCallingOptions, AddressLike, MethodTransactionOptions, TransactionResult, QuantityLike, SmartContractInterface, TransactionBuildDetails, BlockTag, RPCOptions, ABILike } from "@asanrom/smart-contract-wrapper";

/**
 * Contract wrapper: ExampleContract
 * This is an example smart contract
 */
export class ExampleContractWrapper {
    /**
     * Gets the ABI the smart contract
     * @returns The ABI
     */
    public static abi(): ABILike {
        return CONTRACT_ABI;
    }

    /**
     * Address of the smart contract
     */
    public address: Address;

    private _contractInterface: SmartContractInterface;

    /**
     * Deploys the smart contract
     * @param bytecode The smart contract bytecode
     * @param options The options for sending the transaction
     * @returns An smart contract wrapper for the deployed contract
     */
    public static async deploy(bytecode: BytesLike, options: TransactionSendingOptions): Promise<ExampleContractWrapper> {
        const deployed = await deploySmartContract(bytecode, CONTRACT_ABI, [], 0, options);
        if (deployed.receipt.status > BigInt(0)) {
            return new ExampleContractWrapper(deployed.result, options);
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets transaction details to deploy an smart contract
     * @param bytecode The smart contract bytecode
     * @returns An smart contract wrapper for the deployed contract
     */
    public static getDeployTxBuildDetails(bytecode: BytesLike): TransactionBuildDetails {
        return getTxBuildDetailsForDeploy(bytecode, CONTRACT_ABI, [], 0);
    }

    /**
     * Wrapper constructor
     * @param address Address of the smart contract
     * @param rpcOptions Options to connect to the blockchain
     */
    constructor(address: AddressLike, rpcOptions: RPCOptions) {
        this._contractInterface = new SmartContractInterface(address, CONTRACT_ABI, rpcOptions);
        this.address = this._contractInterface.address;
    }

    /**
     * Calls View method: UPGRADE_INTERFACE_VERSION()
     * Method: UPGRADE_INTERFACE_VERSION()
     * @param options The options for sending the request
     * @returns The result for calling the method
     */
    public async UPGRADE_INTERFACE_VERSION(options?: MethodCallingOptions): Promise<string> {
        const __r: any = await this._contractInterface.callViewMethod("UPGRADE_INTERFACE_VERSION", [], options || {});
        return __r[0];
    }

    /**
     * Calls View method: getInitializedVersion()
     * Gets the current initialized version Use this method to figure out the last deployed version of the contract
     * @param options The options for sending the request
     * @returns The result for calling the method
     */
    public async getInitializedVersion(options?: MethodCallingOptions): Promise<Quantity> {
        const __r: any = await this._contractInterface.callViewMethod("getInitializedVersion", [], options || {});
        return __r[0];
    }

    /**
     * Calls View method: getTestValues()
     * Gets the current test values
     * @param options The options for sending the request
     * @returns exampleValue1 Example value 1
     * @returns exampleValue2 Example value 2
     * @returns exampleValue3 Example value 3
     */
    public async getTestValues(options?: MethodCallingOptions): Promise<{exampleValue1: Quantity, exampleValue2: string, exampleValue3: Address}> {
        const __r: any = await this._contractInterface.callViewMethod("getTestValues", [], options || {});
        return {
            exampleValue1: __r[0],
            exampleValue2: __r[1],
            exampleValue3: __r[2],
        };
    }

    /**
     * Calls View method: paused()
     * Checks if the smart contract is paused
     * @param options The options for sending the request
     * @returns bool True if paused, false otherwise
     */
    public async paused(options?: MethodCallingOptions): Promise<boolean> {
        const __r: any = await this._contractInterface.callViewMethod("paused", [], options || {});
        return __r[0];
    }

    /**
     * Calls View method: proxiableUUID()
     * Method: proxiableUUID()
     * @param options The options for sending the request
     * @returns The result for calling the method
     */
    public async proxiableUUID(options?: MethodCallingOptions): Promise<string> {
        const __r: any = await this._contractInterface.callViewMethod("proxiableUUID", [], options || {});
        return __r[0];
    }

    /**
     * Calls Transaction method: initialize(address,address)
     * Initializes the smart contract
     * @param roleManagerAddress The address of the role manager smart contract
     * @param upgradeControlAddress The address of the upgrade control smart contract
     * @param options The options for sending the transaction
     * @returns The transaction result
     */
    public async initialize(roleManagerAddress: AddressLike, upgradeControlAddress: AddressLike, options: MethodTransactionOptions): Promise<TransactionResult<ExampleContractEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("initialize", [roleManagerAddress, upgradeControlAddress], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new ExampleContractEventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets details for building a transaction calling the method: initialize(address,address)
     * Initializes the smart contract
     * @param roleManagerAddress The address of the role manager smart contract
     * @param upgradeControlAddress The address of the upgrade control smart contract
     * @returns The details for building the transaction
     */
    public initialize$txBuildDetails(roleManagerAddress: AddressLike, upgradeControlAddress: AddressLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("initialize", [roleManagerAddress, upgradeControlAddress]);
    }

    /**
     * Calls Transaction method: pause()
     * Pauses the smart contract Requires ADMIN role
     * @param options The options for sending the transaction
     * @returns The transaction result
     */
    public async pause(options: MethodTransactionOptions): Promise<TransactionResult<ExampleContractEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("pause", [], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new ExampleContractEventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets details for building a transaction calling the method: pause()
     * Pauses the smart contract Requires ADMIN role
     * @returns The details for building the transaction
     */
    public pause$txBuildDetails(): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("pause", []);
    }

    /**
     * Calls Transaction method: setTestValues(uint256,string,address)
     * Sets some test values Requires role: TEST_ROLE
     * @param exampleValue1 Example value 1
     * @param exampleValue2 Example value 2
     * @param exampleValue3 Example value 3
     * @param options The options for sending the transaction
     * @returns The transaction result
     */
    public async setTestValues(exampleValue1: QuantityLike, exampleValue2: string, exampleValue3: AddressLike, options: MethodTransactionOptions): Promise<TransactionResult<ExampleContractEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("setTestValues", [exampleValue1, exampleValue2, exampleValue3], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new ExampleContractEventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets details for building a transaction calling the method: setTestValues(uint256,string,address)
     * Sets some test values Requires role: TEST_ROLE
     * @param exampleValue1 Example value 1
     * @param exampleValue2 Example value 2
     * @param exampleValue3 Example value 3
     * @returns The details for building the transaction
     */
    public setTestValues$txBuildDetails(exampleValue1: QuantityLike, exampleValue2: string, exampleValue3: AddressLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("setTestValues", [exampleValue1, exampleValue2, exampleValue3]);
    }

    /**
     * Calls Transaction method: unpause()
     * Unpauses the smart contract Requires ADMIN role
     * @param options The options for sending the transaction
     * @returns The transaction result
     */
    public async unpause(options: MethodTransactionOptions): Promise<TransactionResult<ExampleContractEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("unpause", [], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new ExampleContractEventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets details for building a transaction calling the method: unpause()
     * Unpauses the smart contract Requires ADMIN role
     * @returns The details for building the transaction
     */
    public unpause$txBuildDetails(): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("unpause", []);
    }

    /**
     * Calls Transaction method: upgradeToAndCall(address,bytes)
     * Method: upgradeToAndCall(address,bytes)
     * @param newImplementation newImplementation
     * @param data data
     * @param options The options for sending the transaction
     * @returns The transaction result
     */
    public async upgradeToAndCall(newImplementation: AddressLike, data: BytesLike, options: MethodTransactionOptions): Promise<TransactionResult<ExampleContractEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("upgradeToAndCall", [newImplementation, data], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new ExampleContractEventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets details for building a transaction calling the method: upgradeToAndCall(address,bytes)
     * Method: upgradeToAndCall(address,bytes)
     * @param newImplementation newImplementation
     * @param data data
     * @returns The details for building the transaction
     */
    public upgradeToAndCall$txBuildDetails(newImplementation: AddressLike, data: BytesLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("upgradeToAndCall", [newImplementation, data]);
    }

    /**
     * Finds events sent by the smart contract
     * @param fromBlock Beginning of the block range
     * @param toBlock Ending of the block range
     * @returns A connection of events
     */
    public async findEvents(fromBlock: QuantityLike | BlockTag, toBlock: QuantityLike | BlockTag): Promise<ExampleContractEventCollection> {
        const events = await this._contractInterface.findEvents(fromBlock, toBlock);
        return new ExampleContractEventCollection(events);
    }
}

/**
 * Possible event types for contract: ExampleContract
 */
export type ExampleContractEventType = "Initialized" | "Paused" | "TestEvent" | "Unpaused" | "Upgraded";

/**
 * Collection of events for contract: ExampleContract
 */
export class ExampleContractEventCollection {
    /**
     * Array of events
     */
    public events: SmartContractEvent[];

    /**
     * Event collection constructor
     * @param events Array of events
     */
    constructor(events: SmartContractEvent[]) {
        this.events = events;
    }

    /**
     * Gets the number of events in the collection
     * @returns The event count
     */
    public length(): number {
        return this.events.length;
    }

    /**
     * Gets the event type given the index
     * @param index Event index in the collection (from 0 to length - 1)
     * @returns The event type
     */
    public getEventType(index: number): ExampleContractEventType {
        return <any>this.events[index].name;
    }

    /**
     * Filters the collection by event type
     * @param eventType The event type
     * @returns A collection containing only the event of the specified type
     */
    public filter(eventType: ExampleContractEventType): ExampleContractEventCollection {
        return new ExampleContractEventCollection(this.events.filter(event => event.name === eventType));
    }

    /**
     * Get an event of type Initialized(uint64) from the collection
     * @param index Event index in the collection (from 0 to length - 1)
     * @returns The event object
     */
    public getInitializedEvent(index: number): SmartContractEventWrapper<InitializedEvent> {
        const __r: any = this.events[index].parameters;
        return {
            event: this.events[index],
            data: {
                version: __r[0],
            },
        };
    }

    /**
     * Get an event of type Paused(address) from the collection
     * @param index Event index in the collection (from 0 to length - 1)
     * @returns The event object
     */
    public getPausedEvent(index: number): SmartContractEventWrapper<PausedEvent> {
        const __r: any = this.events[index].parameters;
        return {
            event: this.events[index],
            data: {
                by: __r[0],
            },
        };
    }

    /**
     * Get an event of type TestEvent(uint256,string,address) from the collection
     * @param index Event index in the collection (from 0 to length - 1)
     * @returns The event object
     */
    public getTestEventEvent(index: number): SmartContractEventWrapper<TestEventEvent> {
        const __r: any = this.events[index].parameters;
        return {
            event: this.events[index],
            data: {
                exampleValue1: __r[0],
                exampleValue2: __r[1],
                exampleValue3: __r[2],
            },
        };
    }

    /**
     * Get an event of type Unpaused(address) from the collection
     * @param index Event index in the collection (from 0 to length - 1)
     * @returns The event object
     */
    public getUnpausedEvent(index: number): SmartContractEventWrapper<UnpausedEvent> {
        const __r: any = this.events[index].parameters;
        return {
            event: this.events[index],
            data: {
                by: __r[0],
            },
        };
    }

    /**
     * Get an event of type Upgraded(address) from the collection
     * @param index Event index in the collection (from 0 to length - 1)
     * @returns The event object
     */
    public getUpgradedEvent(index: number): SmartContractEventWrapper<UpgradedEvent> {
        const __r: any = this.events[index].parameters;
        return {
            event: this.events[index],
            data: {
                implementation: __r[0],
            },
        };
    }
}

/**
 * Event: Initialized(uint64)
 */
export interface InitializedEvent {
    version: Quantity,
}

/**
 * Event: Paused(address)
 * Paused - The smart contract was paused
 */
export interface PausedEvent {
    /**
     * The administrator who paused the smart contract
     */
    by: Address,
}

/**
 * Event: TestEvent(uint256,string,address)
 * TestEvent - An example event
 */
export interface TestEventEvent {
    /**
     * Example value 1
     */
    exampleValue1: Quantity,

    /**
     * Example value 2
     */
    exampleValue2: string,

    /**
     * Example value 3
     */
    exampleValue3: Address,
}

/**
 * Event: Unpaused(address)
 * Paused - The smart contract was paused
 */
export interface UnpausedEvent {
    /**
     * The administrator who paused the smart contract
     */
    by: Address,
}

/**
 * Event: Upgraded(address)
 */
export interface UpgradedEvent {
    implementation: Address,
}

const CONTRACT_ABI: ABILike = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "target",
                "type": "address"
            }
        ],
        "name": "AddressEmptyCode",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            }
        ],
        "name": "ERC1967InvalidImplementation",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "ERC1967NonPayable",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "FailedInnerCall",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidInitialization",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "NotInitializing",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "UUPSUnauthorizedCallContext",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "slot",
                "type": "bytes32"
            }
        ],
        "name": "UUPSUnsupportedProxiableUUID",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint64",
                "name": "version",
                "type": "uint64"
            }
        ],
        "name": "Initialized",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "by",
                "type": "address"
            }
        ],
        "name": "Paused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "exampleValue1",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "exampleValue2",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "exampleValue3",
                "type": "address"
            }
        ],
        "name": "TestEvent",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "by",
                "type": "address"
            }
        ],
        "name": "Unpaused",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            }
        ],
        "name": "Upgraded",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "UPGRADE_INTERFACE_VERSION",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getInitializedVersion",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "v",
                "type": "uint64"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getTestValues",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "exampleValue1",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "exampleValue2",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "exampleValue3",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "roleManagerAddress",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "upgradeControlAddress",
                "type": "address"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "paused",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "proxiableUUID",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "exampleValue1",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "exampleValue2",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "exampleValue3",
                "type": "address"
            }
        ],
        "name": "setTestValues",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "unpause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newImplementation",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "upgradeToAndCall",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
];
