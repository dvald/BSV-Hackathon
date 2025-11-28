// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/**
 * Pausable interface
 */
interface IPausable {
    /**
     * Paused - The smart contract was paused
     * @param by The administrator who paused the smart contract
     */
    event Paused(address by);

    /**
     * Paused - The smart contract was paused
     * @param by The administrator who paused the smart contract
     */
    event Unpaused(address by);

    /**
     * Checks if the smart contract is paused
     * @return bool True if paused, false otherwise
     */
    function paused() external view returns (bool);

    /**
     * Pauses the smart contract
     */
    function pause() external;

    /**
     * Unpauses the smart contract
     */
    function unpause() external;
}
