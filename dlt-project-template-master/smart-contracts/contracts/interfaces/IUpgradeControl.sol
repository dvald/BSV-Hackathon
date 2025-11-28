// SPDX-License-Identifier: unspecified

pragma solidity ^0.8.24;

/**
 * Upgrade control (Interface)
 */
interface IUpgradeControl {
    /**
     * ContractUpgraded - A smart contract was upgraded
     * @param proxy The address of the proxy contract
     * @param implementation The address of the implementation contract
     * @param by The address of the administrator who made the upgrade
     */
    event ContractUpgraded(address proxy, address implementation, address by);

    /**
     * Upgrades a smart contract
     * Requires ADMIN role
     * @param proxy The address of the proxy contract
     * @param implementation The address of the implementation contract
     */
    function upgradeContract(address proxy, address implementation) external;

    /**
     * Upgrades a smart contract and calls a re-initializer
     * Requires ADMIN role
     * @param proxy The address of the proxy contract
     * @param implementation The address of the implementation contract
     * @param callData The callData of the re-initializer
     */
    function upgradeContractAndCall(address proxy, address implementation, bytes memory callData) external;
}
