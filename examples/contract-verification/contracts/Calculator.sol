//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./libraries/Maths.sol";

library Calculator {
    using Maths for uint32;

    function calculateStuff(uint32 startingPoint)
        public
        pure
        returns (uint256, uint256)
    {
        return (
            startingPoint.sumOfArithmeticProgression(2, 4),
            startingPoint.sumOfGeometricProgression(2, 4)
        );
    }
}
