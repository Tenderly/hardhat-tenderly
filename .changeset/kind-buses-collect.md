---
"@tenderly/hardhat-tenderly": minor
"@tenderly/hardhat-integration": patch
"@tenderly/api-client": patch
---

Implement automatic verification for proxies via the `@openzeppelin/hardhat-upgrades` library for `@tenderly/hardhat-tenderly@^1.0.0`.

Added examples in `ethers-v5` directory to show how this automatic verification of proxies works.

Removed the need to call `tdly.setup()` function in `hardhat.config.ts` file.
From now, it’s enough to call `import "@tenderly/hardhat-tenderly";` after importing `hardhat-ethers` and `hardhat-upgrades`.

Modified `examples/` to not use the `tdly.setup()` function.

Fixed the error that has been showing during populating the networks step.
