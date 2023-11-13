---
"@tenderly/hardhat-tenderly": major
"tenderly": minor
---

# Major `@tenderly/hardhat-tenderly` update!

From now on, `@tenderly/hardhat-tenderly` can work with `ethers-v6` and `@nomicfoundation/hardhat-ethers@3.0.0` packages.

This update is needed since there are new ways to deploy and wait for the deployed contract.

Basically, our automatic verification overrides the `ethers` property of the `HardhatRuntimeEnvironment` and adds custom logic for verification to it.

So now, we had to override the `ethers.deployContract` method to return our own `TdlyContract` which wrapped the `ethers.Contract` and its `waitForDeployment()` method.

# Migrating from `ethers-v5` and `@nomiclabs/hardhat-ethers`

Everything pretty much stays the same, except different names are involved.

`Contract.deploy()` becomes `ethers.deploy('contract')`

`contract.deployed()` becomes `contract.waitForDeployment()`

You can check out our updated [examples/contract-verification](https://github.com/Tenderly/hardhat-tenderly/tree/master/examples/contract-verification) folder that has examples that work with the new package versions.

