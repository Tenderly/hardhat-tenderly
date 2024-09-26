# @tenderly/hardhat-tenderly

## 2.3.3-beta.0

### Patch Changes

- Updated dependencies []:
  - @tenderly/hardhat-integration@1.0.3-beta.0

## 2.3.2

### Patch Changes

[#225](https://github.com/Tenderly/hardhat-tenderly/pull/225) [`5cc3346825ad3f7d48eabe069a6c61835b26e3b7`](https://github.com/Tenderly/hardhat-tenderly/commit/5cc3346825ad3f7d48eabe069a6c61835b26e3b7) Thanks [@dule-git](https://github.com/dule-git)!

Added error messages if `ethers` and `hardhat-tenderly` versions are not compatible for each other
(`ethersv5` and `@tenderly/hardhat-tenderly@^2.0.0`, or `ethersv6` and `@tenderly/hardhat-tenderly@^1.0.0`.

Also added info log if there's a new `@tenderly/hardhat-tenderly` version available.

## 2.3.2-beta.1

### Patch Changes

- Added alerts if ethers and hardhat-tenderly versions are not compatible for each other (ethersv5 and hardhat-tenderly@2.x.x, or ethersv6 and hardhat-tenderly@1.x.x. Also added alerts if there's a new hardhat-tenderly version available.

## 2.3.2-beta.0

### Patch Changes

- Updated dependencies []:
  - @tenderly/hardhat-integration@1.0.2-beta.0

## 2.3.1

### Patch Changes

- [#214](https://github.com/Tenderly/hardhat-tenderly/pull/214) [`3ccd4eb97085a2f7c0fd4a1a6dfc7db3ec8aca95`](https://github.com/Tenderly/hardhat-tenderly/commit/3ccd4eb97085a2f7c0fd4a1a6dfc7db3ec8aca95) Thanks [@dule-git](https://github.com/dule-git)! - Restructured internal packages

## 2.3.0

### Minor Changes

- [#191](https://github.com/Tenderly/hardhat-tenderly/pull/191) [`81d05944900fa16e42c3a786514b8afcd38ac82c`](https://github.com/Tenderly/hardhat-tenderly/commit/81d05944900fa16e42c3a786514b8afcd38ac82c) Thanks [@ElaNej](https://github.com/ElaNej)! - Support hardhat-ignition

## 2.2.2

### Patch Changes

- [#184](https://github.com/Tenderly/hardhat-tenderly/pull/184) [`2485b9c568a5520ed42928d2f6b99fa86c58b54b`](https://github.com/Tenderly/hardhat-tenderly/commit/2485b9c568a5520ed42928d2f6b99fa86c58b54b) Thanks [@dule-git](https://github.com/dule-git)! - Added hardhat example project for ethers-5 and changed AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG to TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG

## 2.2.1

### Patch Changes

- [#179](https://github.com/Tenderly/hardhat-tenderly/pull/179) [`676045c3adf883c046d79af0a5d8bf34f2d9f165`](https://github.com/Tenderly/hardhat-tenderly/commit/676045c3adf883c046d79af0a5d8bf34f2d9f165) Thanks [@dule-git](https://github.com/dule-git)! - Fix empty array to verify

## 2.2.0

### Minor Changes

- [#176](https://github.com/Tenderly/hardhat-tenderly/pull/176) [`b96d3a8f9a1c934f90ed488260956b826f5c5a20`](https://github.com/Tenderly/hardhat-tenderly/commit/b96d3a8f9a1c934f90ed488260956b826f5c5a20) Thanks [@dule-git](https://github.com/dule-git)! - Implement manual and automatic verification of proxies deployed with `@openzeppelin/hardhat-upgrades`.

### Patch Changes

- Updated dependencies [[`b96d3a8f9a1c934f90ed488260956b826f5c5a20`](https://github.com/Tenderly/hardhat-tenderly/commit/b96d3a8f9a1c934f90ed488260956b826f5c5a20)]:
  - tenderly@0.9.0

## 2.1.1

### Patch Changes

- [#173](https://github.com/Tenderly/hardhat-tenderly/pull/173) [`7fd53a1`](https://github.com/Tenderly/hardhat-tenderly/commit/7fd53a1759c2443322ef2b729617d79c0b183e7f) Thanks [@dule-git](https://github.com/dule-git)! - Expand the recognition of RPC url for Tenderly networks

## 2.1.0

### Minor Changes

- [#169](https://github.com/Tenderly/hardhat-tenderly/pull/169) [`a863634`](https://github.com/Tenderly/hardhat-tenderly/commit/a863634a36510f9ea91c8e9e31453f04c16ca8bf) Thanks [@dule-git](https://github.com/dule-git)! - Enable multiple tenderly networks in hardhat.config.ts

  From now on, you can put multiple networks in your `hardhat.config.ts` file in the `networks` property without the need name the network `tenderly` or `devnet`.

  Just put:

  ```ts
  networks: {
    my_tenderly_network_1: {
      url: "https://rpc.tenderly.co/fork/<forkId>",
    },
    my_tenderly_network_2: {
      url: "https://rpc.tenderly.co/fork/<forkId>",
    },
  }
  ```

  After that you can do:

  ```bash
  npx hardhat run scripts/deploy.ts --network my_tenderly_network_1
  ```

### Patch Changes

- Updated dependencies [[`a863634`](https://github.com/Tenderly/hardhat-tenderly/commit/a863634a36510f9ea91c8e9e31453f04c16ca8bf)]:
  - tenderly@0.8.0

## 2.0.1

### Major Changes

- [#164](https://github.com/Tenderly/hardhat-tenderly/pull/164) [`02952c4`](https://github.com/Tenderly/hardhat-tenderly/commit/02952c4b59f4b332e5742deb6251d9a282fbfa34) Thanks [@dule-git](https://github.com/dule-git)! - # Major `@tenderly/hardhat-tenderly` update!

  From now on, `@tenderly/hardhat-tenderly` can work with `ethers-v6` and `@nomicfoundation/hardhat-ethers@3.0.0` packages.

  This update is needed since there are new ways to deploy and wait for the deployed contract.

  Basically, our automatic verification overrides the `ethers` property of the `HardhatRuntimeEnvironment` and adds custom logic for verification to it.

  So now, we had to override the `ethers.deployContract` method to return our own `TdlyContract` which wrapped the `ethers.Contract` and its `waitForDeployment()` method.

  # Migrating from `ethers-v5` and `@nomiclabs/hardhat-ethers`

  Everything pretty much stays the same, except different names are involved.

  `Contract.deploy()` becomes `ethers.deployContract('contract')`

  `contract.deployed()` becomes `contract.waitForDeployment()`

  You can check out our updated [examples/contract-verification](https://github.com/Tenderly/hardhat-tenderly/tree/master/examples/contract-verification) folder that has examples that work with the new package versions.

### Patch Changes

- Updated dependencies [[`02952c4`](https://github.com/Tenderly/hardhat-tenderly/commit/02952c4b59f4b332e5742deb6251d9a282fbfa34)]:
  - tenderly@0.7.0
