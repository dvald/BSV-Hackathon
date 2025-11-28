// SPDX-License-Identifier: unspecified

pragma solidity ^0.8.24;

/**
 * Simple storage contract for testing purposes
 */
interface ISimpleStorage {
    /**
     * StoredValue - Value stored
     * @param value The value
     */
    event StoredValue(uint256 value);

    /**
     * Gets the version of the contract
     * @return v The version
     */
    function version() external pure returns (uint256 v);

    /**
     * Gets the current value
     * @return value The value
     */
    function getValue() external view returns (uint256 value);

    /**
     * Sets the value
     * @param value The value
     */
    function setValue(uint256 value) external;
}