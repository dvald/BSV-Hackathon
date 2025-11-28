// SPDX-License-Identifier: unspecified

pragma solidity ^0.8.24;

import "./interfaces/IRoleManager.sol";
import "./interfaces/IUpgradeControl.sol";
import "./utils/UUPSUpgradeable.sol";
import "./utils/Initializable.sol";
import "./utils/IPausable.sol";

/**
 * RoleManager - Smart contract to manage the roles of the participants
 */
contract RoleManager is
    IRoleManager,
    UUPSUpgradeable,
    Initializable,
    IPausable
{
    /* Contract data */

    /**
     * Reference to the UpgradeControl contract
     * Checks for upgrades
     */
    IUpgradeControl private _upgradeControl;

    /**
     * Mapping of roles
     */
    mapping(address => mapping(ROLES => bool)) private _roles;

    /**
     * Paused status
     */
    bool private _paused;

    /* Modifiers */

    /**
     * Modifier to check if the sender has the role ADMIN
     */
    modifier onlyAdmin() {
        require(_roles[msg.sender][ROLES.ADMIN], "Must be admin");
        _;
    }

    /**
     * Modifier to check if the sender can set a specific role
     */
    modifier canSetRole(ROLES role) {
        if (role == ROLES.ADMIN) {
            require(_roles[msg.sender][ROLES.ADMIN], "Must be admin");
        } else {
            require(
                _roles[msg.sender][ROLES.ROLE_MANAGER] ||
                    _roles[msg.sender][ROLES.ADMIN],
                "Must be role manager"
            );
        }
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

    /* Constructor */

    constructor() {}

    /* Initializer */

    /**
     * Initializes the smart contract
     * @param upgradeControlAddress The address of the upgrade control smart contract
     */
    function initialize(address upgradeControlAddress) public reinitializer(1) {
        _upgradeControl = IUpgradeControl(upgradeControlAddress);

        // Give the creator of the contract an initial ADMIN role
        _roles[msg.sender][ROLES.ADMIN] = true;
        emit RoleAssigned(msg.sender, ROLES.ADMIN, msg.sender);
    }

    /* View functions */

    /**
     * Checks if the smart contract is paused
     * @return bool True if paused, false otherwise
     */
    function paused() public view virtual override returns (bool) {
        return _paused;
    }

    /**
     * Checks if an account has a role (or has the role ADMIN)
     * @param account The account address
     * @param role The role to assign
     * @return assigned True in case the role is assigned, false if the role is not assigned to the account
     */
    function hasRole(
        address account,
        ROLES role
    ) public view override returns (bool assigned) {
        return _roles[account][role] || _roles[account][ROLES.ADMIN];
    }

    /**
     * Checks if an account has a role (explicit, won't check for ADMIN role)
     * @param account The account address
     * @param role The role to assign
     * @return assigned True in case the role is assigned, false if the role is not assigned to the account
     */
    function hasRoleExplicit(
        address account,
        ROLES role
    ) public view override returns (bool assigned) {
        return _roles[account][role];
    }

    /**
     * Checks if an account has the ADMIN role
     * @param account The account address
     * @return admin True is the account has the ADMIN role
     */
    function isAdmin(
        address account
    ) public view override returns (bool admin) {
        return _roles[account][ROLES.ADMIN];
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
     * Assigns a role to an account
     * Can only be called by accounts with the ADMIN role
     * @param account The account address
     * @param role The role to assign
     * @return assigned True in case the role was assigned, false in case the account already had the role
     */
    function assignRole(
        address account,
        ROLES role
    ) public override whenNotPaused canSetRole(role) returns (bool assigned) {
        if (_roles[account][role]) {
            return false;
        }

        _roles[account][role] = true;
        emit RoleAssigned(account, role, msg.sender);
    }

    /**
     * Revokes a role from an account
     * Can only be called by accounts with the ADMIN role
     * @param account The account address
     * @param role The role to revoke
     * @return revoked True in case the role was revoked, false in case the account did not have the role
     */
    function revokeRole(
        address account,
        ROLES role
    ) public override whenNotPaused canSetRole(role) returns (bool revoked) {
        if (!_roles[account][role]) {
            return false;
        }

        delete _roles[account][role];
        emit RoleRevoked(account, role, msg.sender);
    }

    /* Other functions */

    /// @inheritdoc UUPSUpgradeable
    function _authorizeUpgrade(
        address newImplementation
    ) internal view override {
        require(newImplementation != address(0), "Invalid address");
        require(msg.sender == address(_upgradeControl), "Not allowed");
    }
}
