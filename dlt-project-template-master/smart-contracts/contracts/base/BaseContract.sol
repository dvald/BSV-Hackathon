// SPDX-License-Identifier: unspecified

pragma solidity ^0.8.24;

import "../interfaces/IUpgradeControl.sol";
import "../interfaces/IRoleManager.sol";
import "../utils/UUPSUpgradeable.sol";
import "../utils/Initializable.sol";
import "../utils/IPausable.sol";

/**
 * Base smart contract
 * Implements the common functions of all the smart contracts
 * Also provides utility modifiers and functions
 */
contract BaseContract is UUPSUpgradeable, Initializable, IPausable {
    /* Contract data */

    /**
     * Reference to the UpgradeControl contract
     * Checks for upgrades
     */
    IUpgradeControl internal _upgradeControl;

    /**
     * Reference to the RoleManager contract
     * Checks for permissions
     */
    IRoleManager internal _roleManager;

    /**
     * Paused status
     */
    bool private _paused;

    /* Modifiers */

    /**
     * Checks if the sender has the role ADMIN
     */
    modifier onlyAdmin() {
        require(_roleManager.isAdmin(msg.sender), "Must be ADMIN");
        _;
    }

    /**
     * Checks if the sender has certain role
     * @param role The role to check for
     */
    modifier onlyRole(ROLES role) {
        require(_roleManager.hasRole(msg.sender, role), "Sender lacks the required role");
        _;
    }

    /**
     * Modifier to make a function callable only when the contract is not paused.
     */
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    /**
     * Modifier to make a function callable only when the contract is paused.
     */
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    /* Initializer functions */

    /**
     * Initializes the base smart contract
     * @param roleManagerAddress The address of the role manager smart contract
     * @param upgradeControlAddress The address of the upgrade control smart contract
     */
    function _initialize_base(
        address roleManagerAddress,
        address upgradeControlAddress
    ) internal onlyInitializing {
        _roleManager = IRoleManager(roleManagerAddress);
        _upgradeControl = IUpgradeControl(upgradeControlAddress);
    }

    /* View functions */

    /**
     * Checks if the smart contract is paused
     * @return bool True if paused, false otherwise
     */
    function paused() public view virtual override returns (bool) {
        return _paused;
    }

    /* Transaction functions */

    /**
     * Pauses the smart contract
     * Requires ADMIN role
     */
    function pause() public virtual override onlyAdmin whenNotPaused {
        _paused = true;
        emit Paused(msg.sender);
    }

    /**
     * Unpauses the smart contract
     * Requires ADMIN role
     */
    function unpause() public virtual override onlyAdmin whenPaused {
        _paused = false;
        emit Unpaused(msg.sender);
    }

    /* Internal functions */

    /// @inheritdoc UUPSUpgradeable
    function _authorizeUpgrade(
        address newImplementation
    ) internal view override {
        require(newImplementation != address(0), "Invalid address");
        require(msg.sender == address(_upgradeControl), "Not allowed");
    }
}
