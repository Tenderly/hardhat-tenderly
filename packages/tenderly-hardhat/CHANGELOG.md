# @tenderly/hardhat-integration

## 1.1.0-beta.2

### Minor Changes

- Implemented private and public ABI verification for Lens Testnet

### Patch Changes

- Updated dependencies []:
  - @tenderly/api-client@1.1.0-beta.4

## 1.0.3-beta.1

### Patch Changes

- Implement automatic verification for proxies via the `@openzeppelin/hardhat-upgrades` library for `@tenderly/hardhat-tenderly@^1.0.0`.

  Added examples in `ethers-v5` directory to show how this automatic verification of proxies works.

  Removed the need to call `tdly.setup()` function in `hardhat.config.ts` file.
  From now, it’s enough to call `import "@tenderly/hardhat-tenderly";` after importing `hardhat-ethers` and `hardhat-upgrades`.

  Modified `examples/` to not use the `tdly.setup()` function.

  Fixed the error that has been showing during populating the networks step.

## 1.0.3-beta.0

### Patch Changes

- ac

- Updated dependencies []:
  - @tenderly/api-client@1.0.2-beta.2

## 1.0.2

### Patch Changes

[#223](https://github.com/Tenderly/hardhat-tenderly/pull/223) [`51fc3b8d9a66d0f1913f77de424c3afe7d5dc472`](https://github.com/Tenderly/hardhat-tenderly/commit/51fc3b8d9a66d0f1913f77de424c3afe7d5dc472) Thanks [@dule-git](https://github.com/dule-git)!

Added error messages if `ethers` and `hardhat-tenderly` versions are not compatible for each other
(`ethersv5` and `@tenderly/hardhat-tenderly@^2.0.0`, or `ethersv6` and `@tenderly/hardhat-tenderly@^1.0.0`.

Also added info log if there's a new `@tenderly/hardhat-tenderly` version available.

## 1.0.2-beta.1

### Patch Changes

- Added alerts if ethers and hardhat-tenderly versions are not compatible for each other (ethersv5 and hardhat-tenderly@2.x.x, or ethersv6 and hardhat-tenderly@1.x.x. Also added alerts if there's a new hardhat-tenderly version available.

## 1.0.2-beta.0

### Patch Changes

- Added alerts if ethers and hardhat-tenderly versions are not compatible for each other (ethersv5 and hardhat-tenderly@2.x.x, or ethersv6 and hardhat-tenderly@1.x.x. Also added alerts if there's a new hardhat-tenderly version available.

- Updated dependencies []:
  - @tenderly/api-client@1.0.2-beta.0

## 1.0.1

### Patch Changes

- [#214](https://github.com/Tenderly/hardhat-tenderly/pull/214) [`3ccd4eb97085a2f7c0fd4a1a6dfc7db3ec8aca95`](https://github.com/Tenderly/hardhat-tenderly/commit/3ccd4eb97085a2f7c0fd4a1a6dfc7db3ec8aca95) Thanks [@dule-git](https://github.com/dule-git)! - Restructured internal packages
