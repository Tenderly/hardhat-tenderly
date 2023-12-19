# @tenderly/hardhat-tenderly

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

## 2.1.0-beta.0

### Minor Changes

- Enable muliple tenderly networks in hardhat.config.ts

### Patch Changes

- Updated dependencies []:
  - tenderly@0.8.0-beta.0

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

## 2.0.0-beta.4

### Major Changes

- Enable @tenderly/hardhat-tenderly to work with @nomicfoundation/hardhat-ethers and ethers-v6

### Patch Changes

- Updated dependencies []:
  - tenderly@0.6.0-beta.1

## 1.8.0

### Minor Changes

- [#161](https://github.com/Tenderly/hardhat-tenderly/pull/161) [`a563356`](https://github.com/Tenderly/hardhat-tenderly/commit/a5633566b33ac7f3a808d4206201c11c443b04d5) Thanks [@veljko-matic](https://github.com/veljko-matic)! - Return valid display link

### Patch Changes

- Updated dependencies [[`a563356`](https://github.com/Tenderly/hardhat-tenderly/commit/a5633566b33ac7f3a808d4206201c11c443b04d5)]:
  - tenderly@0.6.0

## 1.8.0-beta.3

### Minor Changes

- Return valid display link

### Patch Changes

- Updated dependencies []:
  - tenderly@0.6.0-beta.0

## 1.8.0-beta.2

### Minor Changes

- Return valid display link

## 1.7.7

### Patch Changes

- [#151](https://github.com/Tenderly/hardhat-tenderly/pull/151) [`1f5ac79`](https://github.com/Tenderly/hardhat-tenderly/commit/1f5ac79b8ad7964939a83d66c5c46f5a22712168) Thanks [@dule-git](https://github.com/dule-git)! - When looking for the chainId for the network to verify on, firstly look in the network configuration that the user specifed, then look at the base that tenderly has.

## 1.7.6

### Patch Changes

- [#149](https://github.com/Tenderly/hardhat-tenderly/pull/149) [`c1d43a8`](https://github.com/Tenderly/hardhat-tenderly/commit/c1d43a85e8dbf9e1953f8ba5174094cd1553ef02) Thanks [@dule-git](https://github.com/dule-git)! - Enable clients to specify their own `chainId`

## 1.7.5

### Patch Changes

- [#147](https://github.com/Tenderly/hardhat-tenderly/pull/147) [`4326062`](https://github.com/Tenderly/hardhat-tenderly/commit/4326062a176d220ead5cdc810d8e49f903aaa9f6) Thanks [@dule-git](https://github.com/dule-git)! - Added x-user-agent header to request

## 1.7.5-beta.1

## 1.7.5-beta.0

### Patch Changes

- Added x-user-agent header

## 1.7.4

### Patch Changes

- Fixed prebuild.js script

## 1.7.3-beta.2

### Patch Changes

- Another test

- [#143](https://github.com/Tenderly/hardhat-tenderly/pull/143) [`3609782`](https://github.com/Tenderly/hardhat-tenderly/commit/360978244335e2a9e2160e05b871034abd299aea) Thanks [@dule-git](https://github.com/dule-git)! - Fixed a bug that took hardhat's compiler configuration and passed it by reference instead of by value during the verification process.

## 1.7.3-beta.1

### Patch Changes

- Updated dependencies []:
  - tenderly@0.5.2-beta.0

## 1.7.3-beta.0

### Patch Changes

- Fixed a bug that took hardhat's compiler configuration and passed it by reference instead of by value during the verification process.

## 1.7.2

### Patch Changes

- [#140](https://github.com/Tenderly/hardhat-tenderly/pull/140) [`39e1eec`](https://github.com/Tenderly/hardhat-tenderly/commit/39e1eec3e502267d894645fe340a7aee5d024728) Thanks [@dule-git](https://github.com/dule-git)! - Move hardhat to devDependencies

## 1.7.1

### Patch Changes

- [#138](https://github.com/Tenderly/hardhat-tenderly/pull/138) [`b5fca34`](https://github.com/Tenderly/hardhat-tenderly/commit/b5fca3490ecbd1051f32fa1116cd1221d711cd03) Thanks [@veljko-matic](https://github.com/veljko-matic)! - Add ability to provide access key to configureInstance, and logic around devnet and hardhat

## 1.7.0

### Minor Changes

- [#129](https://github.com/Tenderly/hardhat-tenderly/pull/129) [`fd6924d`](https://github.com/Tenderly/hardhat-tenderly/commit/fd6924dc3f530a3f05c159c8aeb6d29786ec3a1a) Thanks [@veljko-matic](https://github.com/veljko-matic)! - Added verification to devnet.

### Patch Changes

- Updated dependencies [[`fd6924d`](https://github.com/Tenderly/hardhat-tenderly/commit/fd6924dc3f530a3f05c159c8aeb6d29786ec3a1a)]:
  - tenderly@0.5.0

## 1.6.1

### Minor Changes

- [#115](https://github.com/Tenderly/hardhat-tenderly/pull/115) [`d420bf1`](https://github.com/Tenderly/hardhat-tenderly/commit/d420bf1ba647f805ed11824448ecb1d3358358b9) Thanks [@dule-git](https://github.com/dule-git)! - Implemented multi-compiler fork verification.

### Patch Changes

- Updated dependencies [[`d420bf1`](https://github.com/Tenderly/hardhat-tenderly/commit/d420bf1ba647f805ed11824448ecb1d3358358b9)]:
  - tenderly@0.4.0

## 1.5.3

### Patch Changes

- [#113](https://github.com/Tenderly/hardhat-tenderly/pull/113) [`64e86cf`](https://github.com/Tenderly/hardhat-tenderly/commit/64e86cfe00fb4c7538ace4b777302d4d2b366ddd) Thanks [@dule-git](https://github.com/dule-git)! - Fixed extracting data from libraries when libraries are not defined.

## 1.5.2

### Patch Changes

- [#111](https://github.com/Tenderly/hardhat-tenderly/pull/111) [`4ecba3b`](https://github.com/Tenderly/hardhat-tenderly/commit/4ecba3b7c8907d0e8e0940a923ecb80a9b923ba0) Thanks [@dule-git](https://github.com/dule-git)! - Updated examples/ directory and updated README.md files

## 1.5.1

### Patch Changes

- [#109](https://github.com/Tenderly/hardhat-tenderly/pull/109) [`1dd5dfd`](https://github.com/Tenderly/hardhat-tenderly/commit/1dd5dfd14b1a24bbb68ed5a67df72bdade17118c) Thanks [@dule-git](https://github.com/dule-git)! - Fixed wrong import.

## 1.5.0

### Minor Changes

- [#101](https://github.com/Tenderly/hardhat-tenderly/pull/101) [`89d473b`](https://github.com/Tenderly/hardhat-tenderly/commit/89d473b98202a88eb612b374f7191ff733df1152) Thanks [@dule-git](https://github.com/dule-git)! - Supported multi-compiler contract verification for private and public verification methods. Offloaded obtaining compilation data to hardhat.

### Patch Changes

- Updated dependencies [[`89d473b`](https://github.com/Tenderly/hardhat-tenderly/commit/89d473b98202a88eb612b374f7191ff733df1152)]:
  - tenderly@0.3.0

## 1.4.1

### Patch Changes

- [#99](https://github.com/Tenderly/hardhat-tenderly/pull/99) [`58ac06f`](https://github.com/Tenderly/hardhat-tenderly/commit/58ac06f9fd7e39b08913dccc380c69f3575f7d28) Thanks [@dule-git](https://github.com/dule-git)! - Bump minor version because 0.1.\* was already published in 2018.

- Updated dependencies [[`58ac06f`](https://github.com/Tenderly/hardhat-tenderly/commit/58ac06f9fd7e39b08913dccc380c69f3575f7d28)]:
  - tenderly@0.2.0

## 1.4.0

### Minor Changes

- [#97](https://github.com/Tenderly/hardhat-tenderly/pull/97) [`0052d68`](https://github.com/Tenderly/hardhat-tenderly/commit/0052d682abb1d87339160a9898a31ed50b54a1dc) Thanks [@dule-git](https://github.com/dule-git)! - Added logs to tenderly service and hardhat-tenderly plugin

### Patch Changes

- Updated dependencies [[`0052d68`](https://github.com/Tenderly/hardhat-tenderly/commit/0052d682abb1d87339160a9898a31ed50b54a1dc)]:
  - tenderly@0.1.0

## 1.3.3

### Patch Changes

- [#92](https://github.com/Tenderly/hardhat-tenderly/pull/92) [`4a95ae7`](https://github.com/Tenderly/hardhat-tenderly/commit/4a95ae7bc1b5407093d049a3c82fedec880aed3e) Thanks [@dule-git](https://github.com/dule-git)! - There was an issue while extracting compiler version from the contracts that were given for verification. We extracted these configurations on our own, thus providing the first compiler configuration that is suitable for a file without minding the dependencies because at the time of implementation of this logic, there weren't any hardhat tasks that could do such things.

  Now, there is a task that can get a compiler job for a given file. A compiler job is hardhats' concept for all the data that is needed for compilation of contracts. It has all the dependencies and the configuration of the compiler.

  We used this task to obtain the compiler job and send it to the backend, after which the problem was fixed.

## 1.3.2

### Patch Changes

- Updated dependencies [[`913aad5`](https://github.com/Tenderly/hardhat-tenderly/commit/913aad5b23e3c3c170a600b7153dfe085be34919)]:
  - tenderly@0.0.3

## 1.3.1

### Patch Changes

- [#86](https://github.com/Tenderly/hardhat-tenderly/pull/86) [`aee1c9b`](https://github.com/Tenderly/hardhat-tenderly/commit/aee1c9be6452842a4eb9090ef2d1b2d62626be23) Thanks [@Riphal](https://github.com/Riphal)! - Fix for https://github.com/Tenderly/hardhat-tenderly/issues/84

## 1.3.0

### Minor Changes

- [#81](https://github.com/Tenderly/hardhat-tenderly/pull/81) [`f9faba6`](https://github.com/Tenderly/hardhat-tenderly/commit/f9faba64370636da1e834b562e6c5b2f42e08362) Thanks [@Riphal](https://github.com/Riphal)! - Refactor

### Patch Changes

- Updated dependencies [[`f9faba6`](https://github.com/Tenderly/hardhat-tenderly/commit/f9faba64370636da1e834b562e6c5b2f42e08362)]:
  - tenderly@0.0.2
