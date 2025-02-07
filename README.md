![npm (tag)](https://img.shields.io/npm/v/@tenderly/hardhat-tenderly/latest?color=23C197&labelColor=060e18&style=for-the-badge)

# @tenderly/hardhat-tenderly

[Hardhat](http://hardhat.org) plugin for integration with [Tenderly](https://tenderly.co).

This repo represents the hardhat-tenderly plugin. With its functionalities, you can verify contracts on the Tenderly platform.
Verification represents an entry point into Tenderly's functionalities. With verified contracts, you can use various features like [debugger](https://docs.tenderly.co/debugger/how-to-use-tenderly-debugger), [simulations and forks](https://docs.tenderly.co/simulations-and-forks/intro-to-simulations) or [devnets](https://docs.tenderly.co/devnets/intro-to-devnets). 
This repo will make it possible to verify your contracts with ease, so you can focus on building your dapp.

You can read about hardhat-tenderly's verification features in detail [here](https://docs.tenderly.co/monitoring/smart-contract-verification/verifying-contracts-using-the-tenderly-hardhat-plugin).

Here's a brief description. There are three modes you can configure to verify your contracts and these are called **Verification Modes**: 
- **Private verification mode** - Only you or people who share the project with you may see the source code of the contract and interact with it.
- **Public verification mode** - Anyone can see the source code of the contract and interact with it.
- **Fork verification mode** - Verify deployed contract on a <b>tenderly fork</b>.
- **Devnet verification mode** - Verify deployed contract on a <b>tenderly devnet</b>.

> [!IMPORTANT]
> The Tenderly Hardhat plugin verifies contracts publicly by default, unless you [configure it to use the private mode.](https://docs.tenderly.co/monitoring/smart-contract-verification/verifying-contracts-using-the-tenderly-hardhat-plugin/private-contract-verification)

Also, there are three ways of how you can actually do the verification based on the mode you configured in verification modes. These ways are called **Verification Approaches**:
- **Automatic verification approach** - The plugin will automatically verify your contracts after each deployment.
- **Manual verification approach** - You will have to manually verify the contracts via plugin method calls.
- **Task verification approach** - Verify your contracts via `tenderly:verify` hardhat task.

You can also verify proxy contracts supported by `@openzeppelin/hardhat-upgrades` plugin. For more information on that, you can check out the chapter about [Proxy Contract Verification](#proxy-contract-verification).

## Installation

```bash
npm install --save-dev @tenderly/hardhat-tenderly
```

And add the following statement to your `hardhat.config.js` or `hardhat.config.ts`:

```js
const tdly = require("@tenderly/hardhat-tenderly");
tdly.setup();
```

Or, if you are using typescript:

```ts
import * as tdly from "@tenderly/hardhat-tenderly";
tdly.setup();
```

### Installing tenderly cli

In order to use all the plugin's functionalities, it will be necessary to have a `tenderly config` file.
This file will be automatically created after you install `tenderly cli` and log in with `tenderly login`.

To install `tenderly cli`, follow the installation steps at [tenderly-cli](https://github.com/Tenderly/tenderly-cli). After that, run:

```bash
tenderly login --authentication-method access-key --access-key {your_access_key} --force
```

Access key can be found under **Settings->Authorization->Generate new access key** in your [Tenderly dashboard](https://dashboard.tenderly.co).


# Verification Modes
This section explains three modes you can configure to verify your contracts. 

First, you need to add the `tenderly` field inside the `HardhatConfig` structure in `hardhat.config.ts`:
```ts
module.exports = {
  solidity: {
      ...
  },
  networks: {
      ...
  },
  tenderly: {
    username: "tenderly", // tenderly username (or organization name)
    project: "project", // project name
    privateVerification: false // if true, contracts will be verified privately, if false, contracts will be verified publicly
  }
}
```
> **Warning**
>: Username can be your own and the username of the organization. Which one, it depends on who is the owner of the project you are trying to verify your contracts on. If the project belongs to the organization you are part of, It should be filled with organization username, otherwise your own username.
> The quickest and most secure way to make sure to which party the project belongs to is to look at the url of the particular project. You will see something like:
https://dashboard.tenderly.co/Tenderly/project/contracts.
You can take the username and project from there. In this case the username is Tenderly and the project is project.

### Private verification mode
In order to configure private verification mode, set `privateVerification` to `true` inside the `tenderly` field inside `hardhat.config.ts`. 
Also, the `--network` flag must NOT be set to `tenderly` or `devnet` when running `npx hardhat run` command, or fork/devnet verification mode will be configured.
### Public verification mode
In order to configure public verification mode, set `privateVerification` to `false` inside the `tenderly` field inside `hardhat.config.ts`.
Also, the `--network` flag must NOT be set to `tenderly` or `devnet` when running `npx hardhat run` command, or fork/devnet verification mode will be configured.
### Fork verification mode
In order to configure fork verification mode, set `privateVerification` to `false` inside the `tenderly` field inside `hardhat.config.ts`.
To configure the fork you want to verify the contracts on, set the `tenderly` network inside `HardhatConfig` structure in `hardhat.config.ts`:
```ts
module.exports = {
  solidity: {
    ...
  },
  networks: {
    ... // other networks 
    sepolia: {
      url: "https://sepolia.gateway.tenderly.co/...",
      accounts: ["0x..."],
    },
    ...,
    // -------- CONFIGURE FORK HERE -----------
    tenderly: {
      url: "https://rpc.tenderly.co/fork/...",
      accounts: ["0x..."]
    }
    // ----------------------------------------
},
  tenderly: { // as before
    username: "tenderly",
    project: "project",
    privateVerification: false
  }
}
```
Parameters:
- `url` is the fork rpc url that you can find on the dashboard in the info tab of the particular fork you want to verify your contracts on.
- `accounts` field should be your private key or mnemonic as with every other network.
> **Pro Tip**:
> You can set multiple tenderly networks in the `networks` property, just name them differently and assign different urls. For example:
>```ts
>networks: {
>  my_tenderly_fork: {
>    url: "https://rpc.tenderly.co/fork/...",
>  },
>  my_tenderly_devnet: {
>    url: "https://rpc.vnet.tenderly.co/devnet/...",
>  }
>}
>```

### Devnet verification mode
In order to configure devnet verification mode, set `privateVerification` to `false` inside the `tenderly` field inside `hardhat.config.ts`.
To configure the devnet you want to verify the contracts on, set the `tenderly` network inside `HardhatConfig` structure in `hardhat.config.ts`:
```ts
module.exports = {
  solidity: {
    ...
  },
  networks: {
    ... // other networks 
    sepolia: {
      url: "https://sepolia.gateway.tenderly.co/...",
      accounts: ["0x..."],
    },
    ...,
    // -------- CONFIGURE DEVNET HERE -----------
    tenderly: {
      url: "https://rpc.vnet.tenderly.co/devnet/...",
      accounts: ["0x..."]
    }
    // ----------------------------------------
},
  tenderly: { // as before
    username: "tenderly",
    project: "project",
    privateVerification: false
  }
}
```
Parameters:
- `url` is the devnet rpc url that you can copy on the dashboard in the Copy RPC link section of the particular devnet you want to verify your contracts on.
- `accounts` field should be your private key or mnemonic as with every other network.
> **Pro Tip**:
> You can set multiple tenderly networks in the `networks` property, just name them differently and assign different urls. For example:
>```ts
>networks: {
>  my_tenderly_fork: {
>    url: "https://rpc.tenderly.co/fork/...",
>  },
>  my_tenderly_devnet: {
>    url: "https://rpc.vnet.tenderly.co/devnet/...",
>  }
>}
>```

# Verification Approaches
This section explains the steps you take to actually verify your contracts.
You can verify your contracts **Automatically**, **Manually** or via **Task**.

You can check the [examples/contract-verification](https://github.com/Tenderly/hardhat-tenderly/tree/master/examples/contract-verification) part of the repo to get more insight into how to use these verification approaches.

For every of these three approaches, you can configure the mode of verification. Either **Private**, **Public**, **Fork** or **Devnet** verification mode. See how to configure these modes in **Verification Modes** section above.

## Automatic verification approach (Recommended)
This approach will automatically verify the contract after deployment. Precisely, when you call the `waitForDeployment()` function as in:
```typescript
import { ethers } from "hardhat";

const greeter = await ethers.deployContract("Greeter", ["Hello, Hardhat!"]);

await greeter.waitForDeployment();
```
The plugin will wait for the contract to be deployed and verify it afterwards.

If you wish to turn off automatic verification, you can do it in `hardhat.config.ts`:

```typescript
import * as tdly from "@tenderly/hardhat-tenderly";

tdly.setup({
  automaticVerifications: false,
});
```

## Manual verification approach
This plugin extends the `HardhatRuntimeEnvironment` by adding a `tenderly` field whose type is `Tenderly`.

With this approach, you can use `tenderly.verify` to trigger manual contract verification.
The same method is called when verifying contracts automatically.

This is an example on how you can call it from your deploy script:

```ts
import { ethers, tenderly } from "hardhat";

let greeter = await ethers.deployContract("Greeter", ["Hello, Hardhat!"]);

greeter = await greeter.waitForDeployment();

await tenderly.verify({
  name: "Greeter",
  address: await greeter.getAddress(),
  libraries: {
      LibraryName1: "0x...",
      LibraryName2: "0x..."
  }
});
```

`verify` accepts contracts as variadic arguments, so you can verify multiple contracts at once:

```ts
const contracts = [
  {
    name: "Greeter",
    address: "0x...",
    libraries: { ... }
  },
  {
    name: "Greeter2",
    address: "0x...",
    libraries: { ... }
  },
];
```

## Task verification approach
This plugin implements the concept of `hardhat task` to verify your contracts.
The task, `tenderly:verify`, is invoked as:
```bash
npx hardhat tenderly:verify Greeter=0x... --network {network_name}
```
For more information on how to use `tenderly:verify` task, run `npx hardhat help tenderly:verify` command.

## More verification approaches
You can also verify your contracts via exposed API calls. Although this is not recommended, you can fill the request and call some of the following methods:
- `verifyMultiCompilerAPI(request: TenderlyVerifyContractsRequest)`
- `verifyForkMultiCompilerAPI(request: TenderlyVerifyContractsRequest)`
- `verifyDevnetMultiCompilerAPI(request: TenderlyVerifyContractsRequest)`

For more information on how to use these methods, you can check out their javadocs.

# Proxy contract verification

This plugin supports verification of proxy contracts, their implementation and all the related contracts.
In order to successfully verify a proxy contract, please read the chapters about [Verification Modes](#verification-modes) and [Verification Approaches](#verification-approaches) first.
This will lead you to setup the configuration the right way, so you can verify your proxy contracts and their implementation on Tenderly.

After you have successfully configured `hardhat.config.ts`, you need to populate the configuration in the format that `@nomicfoundation/hardhat-verify` plugin expects, given that this plugin uses their verification beneath for verifying proxies.
But luckily, we have provided a way to automatically populate the configuration for you, you just need to set the `TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG=true` environment variable.

In order to see how this all plays out, you can clone our [@tenderly/hardhat-tenderly](https://github.com/Tenderly/hardhat-tenderly) repo and navigate to the [examples/contract-verification](https://github.com/Tenderly/hardhat-tenderly/tree/master/examples/contract-verification) directory.
This directory contains all the possibilities that you can explore in order to verify your proxy contracts.
Right now we support, both manual and automatic verification of the following proxy contracts:
- BeaconProxy
- TransparentUpgradeableProxy
- UUPSUpgradeableProxy

And we support them on all type of verification modes (e.g. **devnet**, **fork**, **public**, **private**).

# Troubleshooting
If you are having trouble with the plugin and want to contact support, you can run the deploy script with the following ```--verbose``` flag as so:
```bash
npx hardhat run scripts/{your_deploy_script_here.js} --network {network_name} --verbose > tenderly.log 2>&1
```
or you can run the task with the same `--verbose` flag:
```bash
npx hardhat tenderly:verify Greeter=0x... --network {network_name} --verbose > tenderly.log 2>&1
```
This will create a ```tenderly.log``` file that you can send to our customer support engineers for investigation.
