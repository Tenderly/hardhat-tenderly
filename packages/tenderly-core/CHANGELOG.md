# tenderly

## 0.10.0-beta.1

### Patch Changes

- [#192](https://github.com/Tenderly/hardhat-tenderly/pull/192) [`e056c90e7870ac02eb1f6fd07a1f4bf6972c0821`](https://github.com/Tenderly/hardhat-tenderly/commit/e056c90e7870ac02eb1f6fd07a1f4bf6972c0821) Thanks [@ElaNej](https://github.com/ElaNej)! - Support for hardhat-ignition

## 0.10.0-beta.0

### Minor Changes

- [#192](https://github.com/Tenderly/hardhat-tenderly/pull/192) [`9e8e509535392b3149c8f3d7f9106c392c9436b6`](https://github.com/Tenderly/hardhat-tenderly/commit/9e8e509535392b3149c8f3d7f9106c392c9436b6) Thanks [@ElaNej](https://github.com/ElaNej)! - Support hardhat-ignition

## 0.9.1

### Patch Changes

- [#184](https://github.com/Tenderly/hardhat-tenderly/pull/184) [`2485b9c568a5520ed42928d2f6b99fa86c58b54b`](https://github.com/Tenderly/hardhat-tenderly/commit/2485b9c568a5520ed42928d2f6b99fa86c58b54b) Thanks [@dule-git](https://github.com/dule-git)! - Added hardhat example project for ethers-5 and changed AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG to TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG

## 0.9.1-beta.0

### Patch Changes

- Added hardhat example project for ethers-5 and changed AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG to TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG.

## 0.9.0

### Minor Changes

- [#176](https://github.com/Tenderly/hardhat-tenderly/pull/176) [`b96d3a8f9a1c934f90ed488260956b826f5c5a20`](https://github.com/Tenderly/hardhat-tenderly/commit/b96d3a8f9a1c934f90ed488260956b826f5c5a20) Thanks [@dule-git](https://github.com/dule-git)! - Implement manual and automatic verification of proxies deployed with `@openzeppelin/hardhat-upgrades`.

## 0.9.0-beta.0

### Minor Changes

- Implement manual and automatic verification of proxies deployed with `@openzeppelin/hardhat-upgrades`.

## 0.8.1-beta.0

### Patch Changes

- Extend the recognition of Tenderly networks via the RPC url

## 0.8.0

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

## 0.8.0-beta.1

### Minor Changes

- [#169](https://github.com/Tenderly/hardhat-tenderly/pull/169) [`f9ca615`](https://github.com/Tenderly/hardhat-tenderly/commit/f9ca6151924750d6ab27f706bba96c19c1e0c742) Thanks [@dule-git](https://github.com/dule-git)! - Enable multiple tenderly networks in hardhat.config.ts

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

- Beta testing

## 0.8.0-beta.0

### Minor Changes

- Enable muliple tenderly networks in hardhat.config.ts

## 0.7.0

### Minor Changes

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

## 0.7.0-beta.0

### Minor Changes

- Enable @tenderly/hardhat-tenderly to work with @nomicfoundation/hardhat-ethers and ethers-v6

## 0.6.0

### Minor Changes

- [#161](https://github.com/Tenderly/hardhat-tenderly/pull/161) [`a563356`](https://github.com/Tenderly/hardhat-tenderly/commit/a5633566b33ac7f3a808d4206201c11c443b04d5) Thanks [@veljko-matic](https://github.com/veljko-matic)! - Return valid display link

## 0.6.0-beta.0

### Minor Changes

- Return valid display link

## 0.5.3

### Patch Changes

- [#147](https://github.com/Tenderly/hardhat-tenderly/pull/147) [`4326062`](https://github.com/Tenderly/hardhat-tenderly/commit/4326062a176d220ead5cdc810d8e49f903aaa9f6) Thanks [@dule-git](https://github.com/dule-git)! - Added x-user-agent header to request

## 0.5.3-beta.1

### Patch Changes

- Fixed prebuild.js script

## 0.5.3-beta.0

### Patch Changes

- Added x-user-agent header

## 0.5.2

### Patch Changes

- [#143](https://github.com/Tenderly/hardhat-tenderly/pull/143) [`f2f90f6`](https://github.com/Tenderly/hardhat-tenderly/commit/f2f90f60c531a5b12a0d10eb48cd492c64f01fea) Thanks [@dule-git](https://github.com/dule-git)! - Fixed a bug that took hardhat's compiler configuration and passed it by reference instead of by value during the verification process.

## 0.5.2-beta.1

### Patch Changes

- Another test

- [#143](https://github.com/Tenderly/hardhat-tenderly/pull/143) [`3609782`](https://github.com/Tenderly/hardhat-tenderly/commit/360978244335e2a9e2160e05b871034abd299aea) Thanks [@dule-git](https://github.com/dule-git)! - Fixed a bug that took hardhat's compiler configuration and passed it by reference instead of by value during the verification process.

## 0.5.2-beta.0

### Patch Changes

- Testing beta version packages

## 0.5.1

### Patch Changes

- [#138](https://github.com/Tenderly/hardhat-tenderly/pull/138) [`b5fca34`](https://github.com/Tenderly/hardhat-tenderly/commit/b5fca3490ecbd1051f32fa1116cd1221d711cd03) Thanks [@veljko-matic](https://github.com/veljko-matic)! - Add ability to provide access key to configureInstance, and logic around devnet and hardhat

## 0.5.0

### Minor Changes

- [#129](https://github.com/Tenderly/hardhat-tenderly/pull/129) [`fd6924d`](https://github.com/Tenderly/hardhat-tenderly/commit/fd6924dc3f530a3f05c159c8aeb6d29786ec3a1a) Thanks [@veljko-matic](https://github.com/veljko-matic)! - Added verification to devnet.

## 0.4.0

### Minor Changes

- [#115](https://github.com/Tenderly/hardhat-tenderly/pull/115) [`d420bf1`](https://github.com/Tenderly/hardhat-tenderly/commit/d420bf1ba647f805ed11824448ecb1d3358358b9) Thanks [@dule-git](https://github.com/dule-git)! - Implemented multi-compiler fork verification.

## 0.3.0

### Minor Changes

- [#101](https://github.com/Tenderly/hardhat-tenderly/pull/101) [`89d473b`](https://github.com/Tenderly/hardhat-tenderly/commit/89d473b98202a88eb612b374f7191ff733df1152) Thanks [@dule-git](https://github.com/dule-git)! - Supported multi-compiler contract verification for private and public verification methods. Offloaded obtaining compilation data to hardhat.

## 0.2.0

### Minor Changes

- [#99](https://github.com/Tenderly/hardhat-tenderly/pull/99) [`58ac06f`](https://github.com/Tenderly/hardhat-tenderly/commit/58ac06f9fd7e39b08913dccc380c69f3575f7d28) Thanks [@dule-git](https://github.com/dule-git)! - Bump minor version because 0.1.\* was already published in 2018.

## 0.1.0

### Minor Changes

- [#97](https://github.com/Tenderly/hardhat-tenderly/pull/97) [`0052d68`](https://github.com/Tenderly/hardhat-tenderly/commit/0052d682abb1d87339160a9898a31ed50b54a1dc) Thanks [@dule-git](https://github.com/dule-git)! - Added logs to tenderly service and hardhat-tenderly plugin

## 0.0.3

### Patch Changes

- [#88](https://github.com/Tenderly/hardhat-tenderly/pull/88) [`913aad5`](https://github.com/Tenderly/hardhat-tenderly/commit/913aad5b23e3c3c170a600b7153dfe085be34919) Thanks [@Riphal](https://github.com/Riphal)! - Remove got package, start using axios.

## 0.0.2

### Patch Changes

- [#81](https://github.com/Tenderly/hardhat-tenderly/pull/81) [`f9faba6`](https://github.com/Tenderly/hardhat-tenderly/commit/f9faba64370636da1e834b562e6c5b2f42e08362) Thanks [@Riphal](https://github.com/Riphal)! - Refactor
