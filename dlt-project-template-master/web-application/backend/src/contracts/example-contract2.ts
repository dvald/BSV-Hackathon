// ExampleContract2 contract wrapper

"use strict";

import { AddressLike, BytesLike, TransactionSendingOptions, deploySmartContract, getTxBuildDetailsForDeploy, MethodCallingOptions, Address, SmartContractInterface, TransactionBuildDetails, QuantityLike, BlockTag, RPCOptions, ABILike, SmartContractEvent } from "@asanrom/smart-contract-wrapper";

/**
 * Contract wrapper: ExampleContract2
 * This is an example smart contract that is not upgradeable, and depends on ExampleContract1 for the constructor. Note: Try not to use this kind of contract, since they are not upgradeable and increase the deployment time. This is just an example to know how to deploy this kind of contracts.
 */
export class ExampleContract2Wrapper {
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
     * @param exampleContractAddress Address of ExampleContract
     * @param bytecode The smart contract bytecode
     * @param options The options for sending the transaction
     * @returns An smart contract wrapper for the deployed contract
     */
    public static async deploy(exampleContractAddress: AddressLike, bytecode: BytesLike, options: TransactionSendingOptions): Promise<ExampleContract2Wrapper> {
        const deployed = await deploySmartContract(bytecode, CONTRACT_ABI, [exampleContractAddress], 0, options);
        if (deployed.receipt.status > BigInt(0)) {
            return new ExampleContract2Wrapper(deployed.result, options);
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    /**
     * Gets transaction details to deploy an smart contract
     * @param exampleContractAddress Address of ExampleContract
     * @param bytecode The smart contract bytecode
     * @returns An smart contract wrapper for the deployed contract
     */
    public static getDeployTxBuildDetails(exampleContractAddress: AddressLike, bytecode: BytesLike): TransactionBuildDetails {
        return getTxBuildDetailsForDeploy(bytecode, CONTRACT_ABI, [exampleContractAddress], 0);
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
     * Calls View method: getExampleContractAddress()
     * Gets the address of ExampleContract
     * @param options The options for sending the request
     * @returns The result for calling the method
     */
    public async getExampleContractAddress(options?: MethodCallingOptions): Promise<Address> {
        const __r: any = await this._contractInterface.callViewMethod("getExampleContractAddress", [], options || {});
        return __r[0];
    }

    /**
     * Finds events sent by the smart contract
     * @param fromBlock Beginning of the block range
     * @param toBlock Ending of the block range
     * @returns A connection of events
     */
    public async findEvents(fromBlock: QuantityLike | BlockTag, toBlock: QuantityLike | BlockTag): Promise<ExampleContract2EventCollection> {
        const events = await this._contractInterface.findEvents(fromBlock, toBlock);
        return new ExampleContract2EventCollection(events);
    }
}

/**
 * Possible event types for contract: ExampleContract2
 */
export type ExampleContract2EventType = "string";

/**
 * Collection of events for contract: ExampleContract2
 */
export class ExampleContract2EventCollection {
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
    public getEventType(index: number): ExampleContract2EventType {
        return <any>this.events[index].name;
    }

    /**
     * Filters the collection by event type
     * @param eventType The event type
     * @returns A collection containing only the event of the specified type
     */
    public filter(eventType: ExampleContract2EventType): ExampleContract2EventCollection {
        return new ExampleContract2EventCollection(this.events.filter(event => event.name === eventType));
    }
}

const CONTRACT_ABI: ABILike = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "exampleContractAddress",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "getExampleContractAddress",
        "outputs": [
            {
                "internalType": "address",
                "name": "exampleContractAddress",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
