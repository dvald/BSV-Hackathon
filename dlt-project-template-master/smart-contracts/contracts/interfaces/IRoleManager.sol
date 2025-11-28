// SPDX-License-Identifier: unspecified

pragma solidity ^0.8.24;

/**
 * List of roles
 * Each role refers to a permission
 * An account can have multiple roles in case it is necessary
 * The ADMIN role has all the permissions, effectively having all the roles
 * Add roles below if more are needed
 */
enum ROLES {
    ADMIN, // 0 - Admin role (has all permissions)
    ROLE_MANAGER, // 1 - Role manager role (can set other roles, except the ADMIN role)
    TEST_ROLE // 2 - A example test role, add more roles as you need
}

/**
 * Role manager (Interface)
 */
interface IRoleManager {
    /**
     * RoleAssigned - A role was assigned to an account
     * @param account - The account
     * @param role - The role
     * @param by - The address of the administrator who set the role
     */
    event RoleAssigned(address account, ROLES role, address by);

    /**
     * RoleRevoked - A role was revoked
     * @param account The account
     * @param role The role
     * @param by The address of the administrator who revoked the role
     */
    event RoleRevoked(address account, ROLES role, address by);

    /**
     * Checks if an account has a role (or has the role ADMIN)
     * @param account The account address
     * @param role The role to assign
     * @return assigned True in case the role is assigned, false if the role is not assigned to the account
     */
    function hasRole(
        address account,
        ROLES role
    ) external view returns (bool assigned);

    /**
     * Checks if an account has a role (explicit, won't check for ADMIN role)
     * @param account The account address
     * @param role The role to assign
     * @return assigned True in case the role is assigned, false if the role is not assigned to the account
     */
    function hasRoleExplicit(
        address account,
        ROLES role
    ) external view returns (bool assigned);

    /**
     * Checks if an account has the ADMIN role
     * @param account The account address
     * @return admin True is the account has the ADMIN role
     */
    function isAdmin(
        address account
    ) external view returns (bool admin);

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
    ) external returns (bool assigned);

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
    ) external returns (bool revoked);
}
