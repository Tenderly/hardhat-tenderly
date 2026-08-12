# @tenderly/hardhat-integration

## 1.2.0

### Minor Changes

- [`92c67b67a691dba6a4c94800a5af744cdaddcc88`](https://github.com/Tenderly/hardhat-tenderly/commit/92c67b67a691dba6a4c94800a5af744cdaddcc88) Thanks [@bokirly](https://github.com/bokirly)! - Support Virtual Environment RPC URLs in the region and environment-path forms
  (`virtual.<network>.<region>.rpc.tenderly.co/<org>/<project>/<env-slug>`).

  Previously the plugin only recognized the legacy
  `virtual.<network>.rpc.tenderly.co/<endpoint-uuid>` form, so verification on
  newly created Virtual Environments silently fell through to public/private
  API verification. Environment-path URLs now verify through the
  Etherscan-compatible verifier served on the RPC URL itself (the same flow the
  Tenderly CLI and Foundry use), submitting the solc standard-JSON input from
  the Hardhat build info; the RPC URL authenticates the request. The
  `TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG` flow composes
  `<rpc>/verify` for environment-path URLs without the vnet-type lookup;
  `<rpc>/verify` is the only supported verifier endpoint for Virtual
  Environments and needs no access key.

  Note: verification via `@nomicfoundation/hardhat-verify` (proxy contracts,
  `verify:verify`) against environment-path URLs additionally requires
  `getsourcecode` support on the RPC verifier, which is tracked server-side.

## 1.1.0

### Minor Changes

- [#255](https://github.com/Tenderly/hardhat-tenderly/pull/255) [`d26fc6660acadd680c65f3a18bbf4c367ddf8893`](https://github.com/Tenderly/hardhat-tenderly/commit/d26fc6660acadd680c65f3a18bbf4c367ddf8893) Thanks [@dule-git](https://github.com/dule-git)! - Implemented private and public ABI verification for Lens Testnet

- [#256](https://github.com/Tenderly/hardhat-tenderly/pull/256) [`e4a292637fdff554c8e4015374fee53d6fb0902b`](https://github.com/Tenderly/hardhat-tenderly/commit/e4a292637fdff554c8e4015374fee53d6fb0902b) Thanks [@dule-git](https://github.com/dule-git)! - Implemented private and public ABI verification for Lens Testnet

### Patch Changes

- Updated dependencies [[`d26fc6660acadd680c65f3a18bbf4c367ddf8893`](https://github.com/Tenderly/hardhat-tenderly/commit/d26fc6660acadd680c65f3a18bbf4c367ddf8893), [`e4a292637fdff554c8e4015374fee53d6fb0902b`](https://github.com/Tenderly/hardhat-tenderly/commit/e4a292637fdff554c8e4015374fee53d6fb0902b)]:
  - @tenderly/api-client@1.1.0

## 1.0.2

### Patch Changes

[#223](https://github.com/Tenderly/hardhat-tenderly/pull/223) [`51fc3b8d9a66d0f1913f77de424c3afe7d5dc472`](https://github.com/Tenderly/hardhat-tenderly/commit/51fc3b8d9a66d0f1913f77de424c3afe7d5dc472) Thanks [@dule-git](https://github.com/dule-git)!

Added error messages if `ethers` and `hardhat-tenderly` versions are not compatible for each other
(`ethersv5` and `@tenderly/hardhat-tenderly@^2.0.0`, or `ethersv6` and `@tenderly/hardhat-tenderly@^1.0.0`.

Also added info log if there's a new `@tenderly/hardhat-tenderly` version available.

## 1.0.1

### Patch Changes

- [#214](https://github.com/Tenderly/hardhat-tenderly/pull/214) [`3ccd4eb97085a2f7c0fd4a1a6dfc7db3ec8aca95`](https://github.com/Tenderly/hardhat-tenderly/commit/3ccd4eb97085a2f7c0fd4a1a6dfc7db3ec8aca95) Thanks [@dule-git](https://github.com/dule-git)! - Restructured internal packages
