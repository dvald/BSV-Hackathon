// SPDX-License-Identifier: unspecified

pragma solidity ^0.8.24;

import "./interfaces/IExampleContract.sol";

/**
 * This is an example smart contract that is not upgradeable, and
 * depends on ExampleContract1 for the constructor.
 *
 * Note: Try not to use this kind of contract, since they are not upgradeable
 * and increase the deployment time. This is just an example to know how to deploy this kind of contracts.
 */
contract ExampleContract2 {
    // Reference to ExampleContract
    IExampleContract private _exampleContract;

    /**
     * Constructor
     * @param exampleContractAddress Address of ExampleContract
     */
    constructor(address exampleContractAddress) {
        _exampleContract = IExampleContract(exampleContractAddress);
    }

    /**
     * Gets the address of ExampleContract
     * @return exampleContractAddress The address of ExampleContract
     */
    function getExampleContractAddress() public view returns (address exampleContractAddress) {
        return address(_exampleContract);
    }
}