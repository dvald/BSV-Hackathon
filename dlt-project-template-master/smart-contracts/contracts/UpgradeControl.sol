// SPDX-License-Identifier: unspecified

pragma solidity ^0.8.24;

import "./interfaces/IUpgradeControl.sol";
import "./interfaces/IRoleManager.sol";
import "./utils/UUPSUpgradeable.sol";
import "./utils/Initializable.sol";
import "./utils/IPausable.sol";

/**
 * Upgrade control
 * This smart contract manges the upgrades of other contracts
 */
contract UpgradeControl is
    IUpgradeControl,
    UUPSUpgradeable,
    Initializable,
    IPausable
{
    /* Contract data */

    /**
     * Reference to the RoleManager contract
     * Checks for permissions
     */
    IRoleManager private _roleManager;

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
     * Checks if the implementation contract is upgradeable
     * @param implementation Address of the implementation contract
     */
    modifier _isUupsProxy(address implementation) {
        try IERC1822Proxiable(implementation).proxiableUUID() returns (
            bytes32 slot
        ) {
            if (slot != ERC1967Utils.IMPLEMENTATION_SLOT) {
                revert UUPSUpgradeable.UUPSUnsupportedProxiableUUID(slot);
            }
            _;
        } catch {
            revert ERC1967Utils.ERC1967InvalidImplementation(implementation);
        }
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

    /* Constructor */

    constructor() {}

    /* Initializer */

    /**
     * Initializes the smart contract
     * @param roleManagerAddress The address of the role manager smart contract
     */
    function initialize(address roleManagerAddress) public reinitializer(1) {
        _roleManager = IRoleManager(roleManagerAddress);
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

    /**
     * Upgrades a smart contract
     * Requires ADMIN role
     * @param proxy The address of the proxy contract
     * @param implementation The address of the implementation contract
     */
    function upgradeContract(
        address proxy,
        address implementation
    ) public whenNotPaused onlyAdmin _isUupsProxy(implementation) {
        UUPSUpgradeable(proxy).upgradeToAndCall(implementation, "");

        emit ContractUpgraded(proxy, implementation, msg.sender);
    }

    /**
     * Upgrades a smart contract and calls a re-initializer
     * Requires ADMIN role
     * @param proxy The address of the proxy contract
     * @param implementation The address of the implementation contract
     * @param callData The callData of the re-initializer
     */
    function upgradeContractAndCall(
        address proxy,
        address implementation,
        bytes memory callData
    ) public whenNotPaused onlyAdmin _isUupsProxy(implementation) {
        UUPSUpgradeable(proxy).upgradeToAndCall(implementation, callData);

        emit ContractUpgraded(proxy, implementation, msg.sender);
    }

    /* Other functions */

    /// @inheritdoc UUPSUpgradeable
    function _authorizeUpgrade(
        address newImplementation
    ) internal view override {
        require(newImplementation != address(0), "Invalid address");
        require(msg.sender == address(this), "Not allowed");
    }
}
