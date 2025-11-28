// SPDX-License-Identifier: unspecified

pragma solidity ^0.8.24;

import "./base/BaseContract.sol";
import "./interfaces/IExampleContract.sol";

/**
 * This is an example smart contract
 */
contract ExampleContract is IExampleContract, BaseContract {
    /* Contract data */

    uint256 private _exampleValue1;
    string private _exampleValue2;
    address private _exampleValue3;

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
     * Gets the current test values
     * @return exampleValue1 Example value 1
     * @return exampleValue2 Example value 2
     * @return exampleValue3 Example value 3
     */
    function getTestValues()
        public
        view
        override
        returns (
            uint256 exampleValue1,
            string memory exampleValue2,
            address exampleValue3
        )
    {
        return (_exampleValue1, _exampleValue2, _exampleValue3);
    }

    /* Transaction functions */

    /**
     * Sets some test values
     * Requires role: TEST_ROLE
     * @param exampleValue1 Example value 1
     * @param exampleValue2 Example value 2
     * @param exampleValue3 Example value 3
     */
    function setTestValues(
        uint256 exampleValue1,
        string memory exampleValue2,
        address exampleValue3
    ) public override onlyRole(ROLES.TEST_ROLE) {
        _exampleValue1 = exampleValue1;
        _exampleValue2 = exampleValue2;
        _exampleValue3 = exampleValue3;

        emit TestEvent(exampleValue1, exampleValue2, exampleValue3);
    }
}
