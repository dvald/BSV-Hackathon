# Smart contracts documentation

This document contains the generated documentation of the main smart contracts.

This documentation was extracted from the SolidityDoc present in the methods and events.

## UpgradeControl

Upgrade control This smart contract manges the upgrades of other contracts

### Events

**ContractUpgraded(address,address,address)**
 - Description: ContractUpgraded - A smart contract was upgraded
 - Parameters:
    - `by` - The address of the administrator who made the upgrade
    - `implementation` - The address of the implementation contract
    - `proxy` - The address of the proxy contract

**Initialized(uint64)**
 - Details: Triggered when the contract has been initialized or reinitialized.

**Paused(address)**
 - Description: Paused - The smart contract was paused
 - Parameters:
    - `by` - The administrator who paused the smart contract

**Unpaused(address)**
 - Description: Paused - The smart contract was paused
 - Parameters:
    - `by` - The administrator who paused the smart contract

**Upgraded(address)**
 - Details: Emitted when the implementation is upgraded.


### Methods

**getInitializedVersion()**
 - Description: Gets the current initialized version Use this method to figure out the last deployed version of the contract
 - Returns:
    - `v` - The current initialized version

**initialize(address)**
 - Description: Initializes the smart contract
 - Parameters:
    - `roleManagerAddress` - The address of the role manager smart contract

**pause()**
 - Description: Pauses the smart contract Requires ADMIN role

**paused()**
 - Description: Checks if the smart contract is paused
 - Returns:
    - `_0` - bool True if paused, false otherwise

**proxiableUUID()**
 - Details: Implementation of the ERC1822 {proxiableUUID} function. This returns the storage slot used by the implementation. It is used to validate the implementation's compatibility when performing an upgrade. IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier.

**unpause()**
 - Description: Unpauses the smart contract Requires ADMIN role

**upgradeContract(address,address)**
 - Description: Upgrades a smart contract Requires ADMIN role
 - Parameters:
    - `implementation` - The address of the implementation contract
    - `proxy` - The address of the proxy contract

**upgradeContractAndCall(address,address,bytes)**
 - Description: Upgrades a smart contract and calls a re-initializer Requires ADMIN role
 - Parameters:
    - `callData` - The callData of the re-initializer
    - `implementation` - The address of the implementation contract
    - `proxy` - The address of the proxy contract

**upgradeToAndCall(address,bytes)**
 - Details: Upgrade the implementation of the proxy to `newImplementation`, and subsequently execute the function call encoded in `data`. Calls {_authorizeUpgrade}. Emits an {Upgraded} event.


## RoleManager

RoleManager - Smart contract to manage the roles of the participants

### Events

**Initialized(uint64)**
 - Details: Triggered when the contract has been initialized or reinitialized.

**Paused(address)**
 - Description: Paused - The smart contract was paused
 - Parameters:
    - `by` - The administrator who paused the smart contract

**RoleAssigned(address,uint8,address)**
 - Description: RoleAssigned - A role was assigned to an account
 - Parameters:
    - `account` - - The account
    - `by` - - The address of the administrator who set the role
    - `role` - - The role

**RoleRevoked(address,uint8,address)**
 - Description: RoleRevoked - A role was revoked
 - Parameters:
    - `account` - The account
    - `by` - The address of the administrator who revoked the role
    - `role` - The role

**Unpaused(address)**
 - Description: Paused - The smart contract was paused
 - Parameters:
    - `by` - The administrator who paused the smart contract

**Upgraded(address)**
 - Details: Emitted when the implementation is upgraded.


### Methods

**assignRole(address,uint8)**
 - Description: Assigns a role to an account Can only be called by accounts with the ADMIN role
 - Parameters:
    - `account` - The account address
    - `role` - The role to assign
 - Returns:
    - `assigned` - True in case the role was assigned, false in case the account already had the role

**getInitializedVersion()**
 - Description: Gets the current initialized version Use this method to figure out the last deployed version of the contract
 - Returns:
    - `v` - The current initialized version

**hasRole(address,uint8)**
 - Description: Checks if an account has a role (or has the role ADMIN)
 - Parameters:
    - `account` - The account address
    - `role` - The role to assign
 - Returns:
    - `assigned` - True in case the role is assigned, false if the role is not assigned to the account

**hasRoleExplicit(address,uint8)**
 - Description: Checks if an account has a role (explicit, won't check for ADMIN role)
 - Parameters:
    - `account` - The account address
    - `role` - The role to assign
 - Returns:
    - `assigned` - True in case the role is assigned, false if the role is not assigned to the account

**initialize(address)**
 - Description: Initializes the smart contract
 - Parameters:
    - `upgradeControlAddress` - The address of the upgrade control smart contract

**isAdmin(address)**
 - Description: Checks if an account has the ADMIN role
 - Parameters:
    - `account` - The account address
 - Returns:
    - `admin` - True is the account has the ADMIN role

**pause()**
 - Description: Pauses the smart contract Requires ADMIN role

**paused()**
 - Description: Checks if the smart contract is paused
 - Returns:
    - `_0` - bool True if paused, false otherwise

**proxiableUUID()**
 - Details: Implementation of the ERC1822 {proxiableUUID} function. This returns the storage slot used by the implementation. It is used to validate the implementation's compatibility when performing an upgrade. IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier.

**revokeRole(address,uint8)**
 - Description: Revokes a role from an account Can only be called by accounts with the ADMIN role
 - Parameters:
    - `account` - The account address
    - `role` - The role to revoke
 - Returns:
    - `revoked` - True in case the role was revoked, false in case the account did not have the role

**unpause()**
 - Description: Unpauses the smart contract Requires ADMIN role

**upgradeToAndCall(address,bytes)**
 - Details: Upgrade the implementation of the proxy to `newImplementation`, and subsequently execute the function call encoded in `data`. Calls {_authorizeUpgrade}. Emits an {Upgraded} event.


## ExampleContract

This is an example smart contract

### Events

**Initialized(uint64)**
 - Details: Triggered when the contract has been initialized or reinitialized.

**Paused(address)**
 - Description: Paused - The smart contract was paused
 - Parameters:
    - `by` - The administrator who paused the smart contract

**TestEvent(uint256,string,address)**
 - Description: TestEvent - An example event
 - Parameters:
    - `exampleValue1` - Example value 1
    - `exampleValue2` - Example value 2
    - `exampleValue3` - Example value 3

**Unpaused(address)**
 - Description: Paused - The smart contract was paused
 - Parameters:
    - `by` - The administrator who paused the smart contract

**Upgraded(address)**
 - Details: Emitted when the implementation is upgraded.


### Methods

**getInitializedVersion()**
 - Description: Gets the current initialized version Use this method to figure out the last deployed version of the contract
 - Returns:
    - `v` - The current initialized version

**getTestValues()**
 - Description: Gets the current test values
 - Returns:
    - `exampleValue1` - Example value 1
    - `exampleValue2` - Example value 2
    - `exampleValue3` - Example value 3

**initialize(address,address)**
 - Description: Initializes the smart contract
 - Parameters:
    - `roleManagerAddress` - The address of the role manager smart contract
    - `upgradeControlAddress` - The address of the upgrade control smart contract

**pause()**
 - Description: Pauses the smart contract Requires ADMIN role

**paused()**
 - Description: Checks if the smart contract is paused
 - Returns:
    - `_0` - bool True if paused, false otherwise

**proxiableUUID()**
 - Details: Implementation of the ERC1822 {proxiableUUID} function. This returns the storage slot used by the implementation. It is used to validate the implementation's compatibility when performing an upgrade. IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier.

**setTestValues(uint256,string,address)**
 - Description: Sets some test values Requires role: TEST_ROLE
 - Parameters:
    - `exampleValue1` - Example value 1
    - `exampleValue2` - Example value 2
    - `exampleValue3` - Example value 3

**unpause()**
 - Description: Unpauses the smart contract Requires ADMIN role

**upgradeToAndCall(address,bytes)**
 - Details: Upgrade the implementation of the proxy to `newImplementation`, and subsequently execute the function call encoded in `data`. Calls {_authorizeUpgrade}. Emits an {Upgraded} event.


## ExampleContract2

This is an example smart contract that is not upgradeable, and depends on ExampleContract1 for the constructor. Note: Try not to use this kind of contract, since they are not upgradeable and increase the deployment time. This is just an example to know how to deploy this kind of contracts.

### Methods

**constructor**
 - Description: Constructor
 - Parameters:
    - `exampleContractAddress` - Address of ExampleContract

**getExampleContractAddress()**
 - Description: Gets the address of ExampleContract
 - Returns:
    - `exampleContractAddress` - The address of ExampleContract

