// ERC1967Proxy contract wrapper

"use strict";

import { AddressLike, BytesLike, TransactionSendingOptions, deploySmartContract, getTxBuildDetailsForDeploy, Address, SmartContractEventWrapper, SmartContractEvent, SmartContractInterface, TransactionBuildDetails, QuantityLike, BlockTag, RPCOptions, ABILike } from "@asanrom/smart-contract-wrapper";

/**
 * Contract wrapper: ERC1967Proxy
 */
export class ERC1967ProxyWrapper {
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
     * @param implementation implementation
     * @param _data _data
     * @param bytecode The smart contract bytecode
     * @param options The options for sending the transaction
     * @returns An smart contract wrapper for the deployed contract
     */
    public static async deploy(implementation: AddressLike, _data: BytesLike, bytecode: BytesLike, options: TransactionSendingOptions): Promise<ERC1967ProxyWrapper> {
        const deployed = await deploySmartContract(bytecode, CONTRACT_ABI, [implementation, _data], 0, options);
        if (deployed.receipt.status > BigInt(0)) {
            return new ERC1967ProxyWrapper(deployed.result, options);
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets transaction details to deploy an smart contract
     * @param implementation implementation
     * @param _data _data
     * @param bytecode The smart contract bytecode
     * @returns An smart contract wrapper for the deployed contract
     */
    public static getDeployTxBuildDetails(implementation: AddressLike, _data: BytesLike, bytecode: BytesLike): TransactionBuildDetails {
        return getTxBuildDetailsForDeploy(bytecode, CONTRACT_ABI, [implementation, _data], 0);
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
     * Finds events sent by the smart contract
     * @param fromBlock Beginning of the block range
     * @param toBlock Ending of the block range
     * @returns A connection of events
     */
    public async findEvents(fromBlock: QuantityLike | BlockTag, toBlock: QuantityLike | BlockTag): Promise<ERC1967ProxyEventCollection> {
        const events = await this._contractInterface.findEvents(fromBlock, toBlock);
        return new ERC1967ProxyEventCollection(events);
    }
}

/**
 * Possible event types for contract: ERC1967Proxy
 */
export type ERC1967ProxyEventType = "Upgraded";

/**
 * Collection of events for contract: ERC1967Proxy
 */
export class ERC1967ProxyEventCollection {
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
    public getEventType(index: number): ERC1967ProxyEventType {
        return <any>this.events[index].name;
    }

    /**
     * Filters the collection by event type
     * @param eventType The event type
     * @returns A collection containing only the event of the specified type
     */
    public filter(eventType: ERC1967ProxyEventType): ERC1967ProxyEventCollection {
        return new ERC1967ProxyEventCollection(this.events.filter(event => event.name === eventType));
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
 * Event: Upgraded(address)
 */
export interface UpgradedEvent {
    implementation: Address,
}

const CONTRACT_ABI: ABILike = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "_data",
                "type": "bytes"
            }
        ],
        "stateMutability": "payable",
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
        "stateMutability": "payable",
        "type": "fallback"
    }
];
