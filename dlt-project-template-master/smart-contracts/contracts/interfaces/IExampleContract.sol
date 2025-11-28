// SPDX-License-Identifier: unspecified

pragma solidity ^0.8.24;

/**
 * Test contract (interface)
 */
interface IExampleContract {
    /**
     * TestEvent - An example event
     * @param exampleValue1 Example value 1
     * @param exampleValue2 Example value 2
     * @param exampleValue3 Example value 3
     */
    event TestEvent(
        uint256 exampleValue1,
        string exampleValue2,
        address exampleValue3
    );

    /**
     * Gets the current test values
     * @return exampleValue1 Example value 1
     * @return exampleValue2 Example value 2
     * @return exampleValue3 Example value 3
     */
    function getTestValues()
        external
        view
        returns (
            uint256 exampleValue1,
            string memory exampleValue2,
            address exampleValue3
        );

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
    ) external;
}
