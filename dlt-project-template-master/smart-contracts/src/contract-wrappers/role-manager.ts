// RoleManager contract wrapper

"use strict";

import { BytesLike, TransactionSendingOptions, deploySmartContract, getTxBuildDetailsForDeploy, Quantity, SmartContractEventWrapper, SmartContractEvent, Address, MethodCallingOptions, AddressLike, QuantityLike, MethodTransactionOptions, TransactionResult, SmartContractInterface, TransactionBuildDetails, BlockTag, RPCOptions, ABILike } from "@asanrom/smart-contract-wrapper";

/**
 * Contract wrapper: RoleManager
 * RoleManager - Smart contract to manage the roles of the participants
 */
export class RoleManagerWrapper {
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
    public static async deploy(bytecode: BytesLike, options: TransactionSendingOptions): Promise<RoleManagerWrapper> {
        const deployed = await deploySmartContract(bytecode, CONTRACT_ABI, [], 0, options);
        if (deployed.receipt.status > BigInt(0)) {
            return new RoleManagerWrapper(deployed.result, options);
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
     * Calls View method: hasRole(address,uint8)
     * Checks if an account has a role (or has the role ADMIN)
     * @param account The account address
     * @param role The role to assign
     * @param options The options for sending the request
     * @returns The result for calling the method
     */
    public async hasRole(account: AddressLike, role: QuantityLike, options?: MethodCallingOptions): Promise<boolean> {
        const __r: any = await this._contractInterface.callViewMethod("hasRole", [account, role], options || {});
        return __r[0];
    }

    /**
     * Calls View method: hasRoleExplicit(address,uint8)
     * Checks if an account has a role (explicit, won't check for ADMIN role)
     * @param account The account address
     * @param role The role to assign
     * @param options The options for sending the request
     * @returns The result for calling the method
     */
    public async hasRoleExplicit(account: AddressLike, role: QuantityLike, options?: MethodCallingOptions): Promise<boolean> {
        const __r: any = await this._contractInterface.callViewMethod("hasRoleExplicit", [account, role], options || {});
        return __r[0];
    }

    /**
     * Calls View method: isAdmin(address)
     * Checks if an account has the ADMIN role
     * @param account The account address
     * @param options The options for sending the request
     * @returns The result for calling the method
     */
    public async isAdmin(account: AddressLike, options?: MethodCallingOptions): Promise<boolean> {
        const __r: any = await this._contractInterface.callViewMethod("isAdmin", [account], options || {});
        return __r[0];
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
     * Calls Transaction method: assignRole(address,uint8)
     * Assigns a role to an account Can only be called by accounts with the ADMIN role
     * @param account The account address
     * @param role The role to assign
     * @param options The options for sending the transaction
     * @returns The transaction result
     */
    public async assignRole(account: AddressLike, role: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<RoleManagerEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("assignRole", [account, role], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new RoleManagerEventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets details for building a transaction calling the method: assignRole(address,uint8)
     * Assigns a role to an account Can only be called by accounts with the ADMIN role
     * @param account The account address
     * @param role The role to assign
     * @returns The details for building the transaction
     */
    public assignRole$txBuildDetails(account: AddressLike, role: QuantityLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("assignRole", [account, role]);
    }

    /**
     * Calls Transaction method: initialize(address)
     * Initializes the smart contract
     * @param upgradeControlAddress The address of the upgrade control smart contract
     * @param options The options for sending the transaction
     * @returns The transaction result
     */
    public async initialize(upgradeControlAddress: AddressLike, options: MethodTransactionOptions): Promise<TransactionResult<RoleManagerEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("initialize", [upgradeControlAddress], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new RoleManagerEventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets details for building a transaction calling the method: initialize(address)
     * Initializes the smart contract
     * @param upgradeControlAddress The address of the upgrade control smart contract
     * @returns The details for building the transaction
     */
    public initialize$txBuildDetails(upgradeControlAddress: AddressLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("initialize", [upgradeControlAddress]);
    }

    /**
     * Calls Transaction method: pause()
     * Pauses the smart contract Requires ADMIN role
     * @param options The options for sending the transaction
     * @returns The transaction result
     */
    public async pause(options: MethodTransactionOptions): Promise<TransactionResult<RoleManagerEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("pause", [], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new RoleManagerEventCollection(decodedEvents) };
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
     * Calls Transaction method: revokeRole(address,uint8)
     * Revokes a role from an account Can only be called by accounts with the ADMIN role
     * @param account The account address
     * @param role The role to revoke
     * @param options The options for sending the transaction
     * @returns The transaction result
     */
    public async revokeRole(account: AddressLike, role: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<RoleManagerEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("revokeRole", [account, role], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new RoleManagerEventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets details for building a transaction calling the method: revokeRole(address,uint8)
     * Revokes a role from an account Can only be called by accounts with the ADMIN role
     * @param account The account address
     * @param role The role to revoke
     * @returns The details for building the transaction
     */
    public revokeRole$txBuildDetails(account: AddressLike, role: QuantityLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("revokeRole", [account, role]);
    }

    /**
     * Calls Transaction method: unpause()
     * Unpauses the smart contract Requires ADMIN role
     * @param options The options for sending the transaction
     * @returns The transaction result
     */
    public async unpause(options: MethodTransactionOptions): Promise<TransactionResult<RoleManagerEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("unpause", [], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new RoleManagerEventCollection(decodedEvents) };
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
    public async upgradeToAndCall(newImplementation: AddressLike, data: BytesLike, options: MethodTransactionOptions): Promise<TransactionResult<RoleManagerEventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("upgradeToAndCall", [newImplementation, data], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs);
            return { receipt: __r.receipt, result: new RoleManagerEventCollection(decodedEvents) };
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
    public async findEvents(fromBlock: QuantityLike | BlockTag, toBlock: QuantityLike | BlockTag): Promise<RoleManagerEventCollection> {
        const events = await this._contractInterface.findEvents(fromBlock, toBlock);
        return new RoleManagerEventCollection(events);
    }
}

/**
 * Possible event types for contract: RoleManager
 */
export type RoleManagerEventType = "Initialized" | "Paused" | "RoleAssigned" | "RoleRevoked" | "Unpaused" | "Upgraded";

/**
 * Collection of events for contract: RoleManager
 */
export class RoleManagerEventCollection {
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
    public getEventType(index: number): RoleManagerEventType {
        return <any>this.events[index].name;
    }

    /**
     * Filters the collection by event type
     * @param eventType The event type
     * @returns A collection containing only the event of the specified type
     */
    public filter(eventType: RoleManagerEventType): RoleManagerEventCollection {
        return new RoleManagerEventCollection(this.events.filter(event => event.name === eventType));
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
     * Get an event of type RoleAssigned(address,uint8,address) from the collection
     * @param index Event index in the collection (from 0 to length - 1)
     * @returns The event object
     */
    public getRoleAssignedEvent(index: number): SmartContractEventWrapper<RoleAssignedEvent> {
        const __r: any = this.events[index].parameters;
        return {
            event: this.events[index],
            data: {
                account: __r[0],
                role: __r[1],
                by: __r[2],
            },
        };
    }

    /**
     * Get an event of type RoleRevoked(address,uint8,address) from the collection
     * @param index Event index in the collection (from 0 to length - 1)
     * @returns The event object
     */
    public getRoleRevokedEvent(index: number): SmartContractEventWrapper<RoleRevokedEvent> {
        const __r: any = this.events[index].parameters;
        return {
            event: this.events[index],
            data: {
                account: __r[0],
                role: __r[1],
                by: __r[2],
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
 * Event: RoleAssigned(address,uint8,address)
 * RoleAssigned - A role was assigned to an account
 */
export interface RoleAssignedEvent {
    /**
     * - The account
     */
    account: Address,

    /**
     * - The role
     */
    role: Quantity,

    /**
     * - The address of the administrator who set the role
     */
    by: Address,
}

/**
 * Event: RoleRevoked(address,uint8,address)
 * RoleRevoked - A role was revoked
 */
export interface RoleRevokedEvent {
    /**
     * The account
     */
    account: Address,

    /**
     * The role
     */
    role: Quantity,

    /**
     * The address of the administrator who revoked the role
     */
    by: Address,
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
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "enum ROLES",
                "name": "role",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "by",
                "type": "address"
            }
        ],
        "name": "RoleAssigned",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "enum ROLES",
                "name": "role",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "by",
                "type": "address"
            }
        ],
        "name": "RoleRevoked",
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
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "enum ROLES",
                "name": "role",
                "type": "uint8"
            }
        ],
        "name": "assignRole",
        "outputs": [
            {
                "internalType": "bool",
                "name": "assigned",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
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
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "enum ROLES",
                "name": "role",
                "type": "uint8"
            }
        ],
        "name": "hasRole",
        "outputs": [
            {
                "internalType": "bool",
                "name": "assigned",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "enum ROLES",
                "name": "role",
                "type": "uint8"
            }
        ],
        "name": "hasRoleExplicit",
        "outputs": [
            {
                "internalType": "bool",
                "name": "assigned",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
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
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "isAdmin",
        "outputs": [
            {
                "internalType": "bool",
                "name": "admin",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
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
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "enum ROLES",
                "name": "role",
                "type": "uint8"
            }
        ],
        "name": "revokeRole",
        "outputs": [
            {
                "internalType": "bool",
                "name": "revoked",
                "type": "bool"
            }
        ],
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
