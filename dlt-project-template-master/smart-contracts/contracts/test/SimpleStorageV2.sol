// SPDX-License-Identifier: unspecified

pragma solidity ^0.8.24;

import "./interfaces/ISimpleStorage.sol";
import "../base/BaseContract.sol";

/**
 * Simple storage contract for testing purposes
 */
contract SimpleStorageV2 is ISimpleStorage, BaseContract {
    /* Contract data */

    // The stored value
    uint256 private _value;

    /* Constructor */

    constructor() {}

    /* Initializer */

    /**
     * Initializes the smart contract
     * @param roleManagerAddress The address of the role manager smart contract
     * @param upgradeControlAddress The address of the upgrade control smart contract
     */
    function initialize(
        address roleManagerAddress,
        address upgradeControlAddress
    ) public reinitializer(1) {
        _initialize_base(roleManagerAddress, upgradeControlAddress);
    }

    /* View functions */

    /**
     * Gets the version of the contract
     * @return v The version
     */
    function version() public pure override returns (uint256 v) {
        return 2;
    }

    /**
     * Gets the current value
     * @return value The value
     */
    function getValue() public view override returns (uint256 value) {
        return _value;
    }

    /**
     * Sets the value
     * @param value The value
     */
    function setValue(uint256 value) public onlyAdmin() {
        _value = value;
        emit StoredValue(value);
    }
}
