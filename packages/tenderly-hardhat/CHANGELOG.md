# @tenderly/hardhat-tenderly

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
