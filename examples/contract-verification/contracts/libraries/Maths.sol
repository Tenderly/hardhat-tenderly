//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library Maths {
    function sumOfArithmeticProgression(
        uint32 firstVal,
        uint32 step,
        uint32 lastIdx
    ) public pure returns (uint32) {
        //n/2(2a+(n-1)d)
        return (lastIdx * (2 * firstVal + (lastIdx - 1) * step)) / 2;
    }

    function sumOfGeometricProgression(
        uint32 firstVal,
        uint32 step,
        uint32 lastIdx
    ) public pure returns (uint32) {
        //2a+(2n−1)d(2a−d)
        return 2 * firstVal + (2 * lastIdx - 1) * step * (2 * firstVal - step);
    }

    function sin(int32 rads) public pure returns (int32) {
        return rads;
    }
}
