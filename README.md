![npm (tag)](https://img.shields.io/npm/v/@tenderly/hardhat-tenderly/latest?color=23C197&labelColor=060e18&style=for-the-badge)

# @tenderly/hardhat-tenderly

[Hardhat](https://hardhat.org) plugin for verifying contracts on [Tenderly](https://tenderly.co).

Verified contracts unlock the rest of the Tenderly platform: the [Debugger](https://docs.tenderly.co/debugger/overview), [Simulator](https://docs.tenderly.co/simulator-ui/overview), and readable traces on [Virtual Environments](https://docs.tenderly.co/virtual-environments/overview).

Full documentation: [docs.tenderly.co/contract-verification/hardhat](https://docs.tenderly.co/contract-verification/hardhat).

## Installation

```bash
npm install --save-dev @tenderly/hardhat-tenderly
```

Add a single import to your `hardhat.config.ts` (or `hardhat.config.js`), **after** the other plugin imports (`@nomicfoundation/hardhat-toolbox`, `@nomicfoundation/hardhat-ethers`, `@openzeppelin/hardhat-upgrades`, and similar):

```ts
import "@nomicfoundation/hardhat-toolbox";
import "@tenderly/hardhat-tenderly";
```

That's the whole setup. Calling `tdly.setup()` is no longer needed (it's a no-op kept for backward compatibility since `2.4.0`).

### Tenderly CLI login

Verifying on **public networks** authenticates with your Tenderly access key. Install the [Tenderly CLI](https://github.com/Tenderly/tenderly-cli) and log in once:

```bash
tenderly login --authentication-method access-key --access-key {your_access_key} --force
```

You can generate an access key in the [Tenderly Dashboard](https://dashboard.tenderly.co) under **Account Settings → Authorization**.

Verifying on **Virtual Environments** needs no access key: the environment's RPC URL authenticates the request by itself.

## Configuration

Add a `tenderly` field to your Hardhat config:

```ts
const config: HardhatUserConfig = {
  solidity: "0.8.23",
  networks: {
    // see "Verification targets" below
  },
  tenderly: {
    // The account slug (your username, or the organization slug if the
    // project belongs to an organization). Both are visible in the
    // project's dashboard URL: https://dashboard.tenderly.co/{username}/{project}
    username: process.env.TENDERLY_USERNAME ?? "",
    project: process.env.TENDERLY_PROJECT ?? "",

    // true  -> contracts are visible only inside your project
    // false or omitted -> contracts are verified publicly (default)
    privateVerification: process.env.TENDERLY_PRIVATE_VERIFICATION === "true",
  },
};
```

Environment variables the plugin reads:

| Variable | Default | Effect |
| --- | --- | --- |
| `TENDERLY_AUTOMATIC_VERIFICATION` | `true` | Verify automatically after each deployment. Set to `false` to verify only through explicit `tenderly.verify()` calls or the `tenderly:verify` task. |
| `TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG` | `false` | Auto-fill the `@nomicfoundation/hardhat-verify` `etherscan` configuration; needed for [proxy verification](#proxy-contract-verification). |
| `TENDERLY_ENABLE_OUTDATED_VERSION_CHECK` | `true` | Set to `false` to silence the new-version notice. |

Note that `TENDERLY_PRIVATE_VERIFICATION` in the example above is plain dotenv wiring into `privateVerification` — the switch itself is the config field.

## Verification targets

### Virtual Environments

Point a Hardhat network at your [Virtual Environment](https://docs.tenderly.co/virtual-environments/overview) RPC URL:

```ts
networks: {
  my_tenderly_environment: {
    // The environment's Admin RPC URL, from the dashboard or the API
    url: "https://virtual.mainnet.eu.rpc.tenderly.co/{org}/{project}/{environment-slug}",
  },
},
```

Contracts deployed with `--network my_tenderly_environment` are verified against the environment through its own RPC verifier (`{rpc-url}/verify`). The URL authenticates the request, so no access key is involved, and source visibility follows the environment's [Contract visibility](https://docs.tenderly.co/virtual-environments/explorer#contract-visibility-in-public-explorer) setting.

### Public networks (mainnets and testnets)

Point a network at any RPC for the chain, for example a [Tenderly Node RPC](https://docs.tenderly.co/node-rpc/overview) gateway:

```ts
networks: {
  mainnet: {
    url: "https://mainnet.gateway.tenderly.co",
    accounts: [process.env.PRIVATE_KEY ?? ""],
    chainId: 1,
  },
},
```

- **Public verification** (default): the contract's source becomes visible to everyone on Tenderly.
- **Private verification** (`privateVerification: true`): the contract is verified only inside your project.

## Verification approaches

The [examples/contract-verification](https://github.com/Tenderly/hardhat-tenderly/tree/master/examples/contract-verification) projects exercise every approach below.

### Automatic (recommended)

With `TENDERLY_AUTOMATIC_VERIFICATION` on (the default), contracts verify right after deployment — precisely, when the deployment is awaited:

```ts
import { ethers } from "hardhat";

const greeter = await ethers.deployContract("Greeter", ["Hello, Hardhat!"]);
await greeter.waitForDeployment();
```

To turn it off for a run:

```bash
TENDERLY_AUTOMATIC_VERIFICATION=false npx hardhat run scripts/deploy.ts --network my_tenderly_environment
```

### Manual

The plugin extends the Hardhat runtime with `tenderly.verify()` — the same method the automatic flow calls:

```ts
import { ethers, tenderly } from "hardhat";

let greeter = await ethers.deployContract("Greeter", ["Hello, Hardhat!"]);
greeter = await greeter.waitForDeployment();

await tenderly.verify({
  name: "Greeter",
  address: await greeter.getAddress(),
  // optional, for contracts with linked libraries:
  libraries: {
    LibraryName1: "0x...",
  },
});
```

`verify` takes variadic arguments, so several contracts can be verified in one call.

### Task

```bash
npx hardhat tenderly:verify Greeter=0x... --network {network_name}
```

Run `npx hardhat help tenderly:verify` for the details.

## Proxy contract verification

Proxies deployed and upgraded with [`@openzeppelin/hardhat-upgrades`](https://www.npmjs.com/package/@openzeppelin/hardhat-upgrades) — `TransparentUpgradeableProxy`, `UUPSUpgradeableProxy`, and `BeaconProxy` — are verified automatically on **public networks**, together with their implementation and related contracts.

Proxy verification delegates to `@nomicfoundation/hardhat-verify` under the hood, so set:

```bash
TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG=true
```

and the plugin fills in the required `etherscan` configuration for you. See the [proxy examples](https://github.com/Tenderly/hardhat-tenderly/tree/master/examples/contract-verification) for complete deploy-and-upgrade scripts.

## Troubleshooting

Re-run with `--verbose` and capture the log:

```bash
npx hardhat run scripts/{your_deploy_script.ts} --network {network_name} --verbose > tenderly.log 2>&1
```

Attach `tenderly.log` when contacting [support@tenderly.co](mailto:support@tenderly.co). The [Hardhat verification docs](https://docs.tenderly.co/contract-verification/hardhat) cover the common failure modes.
