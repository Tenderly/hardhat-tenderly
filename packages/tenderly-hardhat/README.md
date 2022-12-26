![npm (tag)](https://img.shields.io/npm/v/@tenderly/hardhat-tenderly/latest?color=23C197&labelColor=060e18&style=for-the-badge)

# hardhat-tenderly

[Hardhat](http://hardhat.org) plugin for integration with [Tenderly](https://tenderly.co).

This repo represents the hardhat-tenderly plugin. With its functionalities, you can verify contracts on the Tenderly platform.
Verification represents an entry point into Tenderly's functionalities. With verified contracts, you can use various features like [debugger](https://docs.tenderly.co/debugger/how-to-use-tenderly-debugger) or [simulations and forks](https://docs.tenderly.co/simulations-and-forks/how-to-simulate-a-transaction). 
This repo will make it possible to verify your contracts with ease, so you can focus on building your dapp.

You can read about hardhat-tenderly's verification features in detail [here](https://docs.tenderly.co/monitoring/smart-contract-verification/verifying-contracts-using-the-tenderly-hardhat-plugin).

Here's a brief description. There are three ways to verify your contracts: 
- <b>Private verification</b> - only you or people who share the project with you may see the source code of the contract and interact with it.
- <b>Public verification</b> - anyone can see the source code of the contract and interact with it.
- <b>Fork verification</b> - verify deployed contract on a [tenderly fork](https://docs.tenderly.co/simulations-and-forks/how-to-create-a-fork).

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

Access key can be found under <b>Settings->Authorization->Generate new access key</b> in your [Tenderly dashboard](https://dashboard.tenderly.co).


# Verification types
This section explains three ways of configuring how you want to verify your contracts. 

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

### Private verification
In order to configure private verification, set `privateVerification` to `true` inside the `tenderly` field inside `hardhat.config.ts`. 
Also, the `--network` flag must NOT be set to `tenderly` when running `npx hardhat run` command, or fork verification will be tempted. 
### Public verification
In order to configure public verification, set `privateVerification` to `false` inside the `tenderly` field inside `hardhat.config.ts`.
Also, the `--network` flag must NOT be set to `tenderly` when running `npx hardhat run` command, or fork verification will be tempted. 
### Fork verification
In order to configure fork verification, set `privateVerification` to `false` inside the `tenderly` field inside `hardhat.config.ts`.
To configure the fork you want to verify the contracts on, set the `tenderly` network inside `HardhatConfig` structure in `hardhat.config.ts`:
```ts
module.exports = {
  solidity: {
    ...
  },
  networks: {
    ...,
    tenderly: {
      url: "https://rpc.tenderly.co/fork/...",
      accounts: ["0x..."]
    }
  },
  tenderly: { // as before
    username: "tenderly",
    project: "project",
    privateVerification: false
  }
}
```
As `url`, provide the fork url that you can find on the dashboard in the info tab of the particular fork you want to verify your contracts on.
`accounts` field should be your private key or mnemonic as with every other network.
Also, the `--network` flag MUST be set to `tenderly` when running `npx hardhat run` command in order to invoke fork verification.

# Verification options
This section explains the steps you take to actually verify your contracts.
You can verify your contracts <b>Automatically</b>, <b>Manually</b> or via <b>Task</b>.

For every of these three options, you can configure what type of verification you want to execute. Either <b>Private</b>, <b>Public</b> or <b>Fork</b> verification. See how to configure these types in <Verification types> section above.

## Automatic verification (Recommended)
This will automatically verify the contract after deployment. Precisely, when you call the `deployed()` function as in:
```typescript
const Greeter = await ethers.getContractFactory("Greeter");
const greeter = await Greeter.deploy("Hello, Hardhat!");

await greeter.deployed();
```
The plugin will wait for the contract to be deployed and verify it afterwards.

If you wish to turn off automatic verification, you can do it in `hardhat.config.ts`:

```typescript
import * as tdly from "@tenderly/hardhat-tenderly";

tdly.setup({
  automaticVerifications: false,
});
```

## Manual verification
This plugin extends the `HardhatRuntimeEnvironment` by adding a `tenderly` field whose type is `Tenderly`.

This field has the `verify` method, and you can use it to trigger manual contract verification.
The same method is called when verifying contracts automatically.

This is an example on how you can call it from your scripts (using ethers to deploy a contract):

```ts
import { ethers, tenderly } from "hardhat";

const Greeter = await ethers.getContractFactory("Greeter");
const greeter = await Greeter.deploy("Hello, Hardhat!");

await greeter.deployed();

await tenderly.verify({
  name: "Greeter",
  address: greeter.address,
});
```

`verify` accepts contracts as variadic arguments, so you can verify multiple contracts at once:

```ts
const contracts = [
  {
    name: "Greeter",
    address: "0x...",
  },
  {
    name: "Greeter2",
    address: "0x...",
  },
];
```

## Verification via Task
This plugin implements the concept of `hardhat task` to verify your contracts.
The task, `tenderly:verify`, is invoked as:
```bash
npx hardhat tenderly:verify Greeter=0x... --network {network_name}
```

## More verification options
You can also verify your contracts via exposed API calls. Although this is not recommended, you can fill the request and call some of the following methods:
- `verifyMultiCompilerAPI(request: TenderlyVerifyContractsRequest)`
- `verifyForkAPI(request: TenderlyForkContractUploadRequest)`

For more information on how to use these methods, you can check our their javadocs.

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
