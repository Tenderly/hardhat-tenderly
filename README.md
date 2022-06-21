![npm (tag)](https://img.shields.io/npm/v/@tenderly/hardhat-tenderly/latest?color=23C197&labelColor=060e18&style=for-the-badge)


# hardhat-tenderly

[Hardhat](http://hardhat.org) plugin for integration with [Tenderly](https://tenderly.co/). 

## What

This plugin will help you verify your Solidity contracts, as well as allow you to 
privately push contracts to [Tenderly](https://tenderly.co/).

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

# Verification options

## Automatic verification

Contract verification works out-of-the box if contracts is deployed via ethers provided in HRE object.

## Manual contract verification - Environment extensions

This plugin extends the Hardhat Runtime Environment by adding a `tenderly` field
whose type is `Tenderly`.

This field has the `verify` and `push` methods, and you can use to trigger manual contract verification.

This is an example on how you can call it from your scripts (using ethers to deploy a contract):
```js
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy("Hello, Hardhat!");

    await greeter.deployed()

    // public contract verification
    await hre.tenderly.verify({
        name: "Greeter",
        address: greeter.address,
    })
```

Both functions accept variadic parameters:
```js
    const contracts = [
    {
        name: "Greeter",
        address: "123"
    },
    {
        name: "Greeter2",
        address: "456"
    }]
    
    // private contract verification
    await hre.tenderly.push(...contracts)
```

## Manual contract verification - HRE Tasks

This plugin adds the _`tenderly:verify`_ task to Hardhat:
```
Usage: hardhat [GLOBAL OPTIONS] tenderly:verify ...contracts

POSITIONAL ARGUMENTS:

  contracts     Addresses and names of contracts that will be verified formatted ContractName=Address 

tenderly-verify: Verifies contracts on Tenderly
```

And the `tenderly:push` task:
```
Usage: hardhat [GLOBAL OPTIONS] tenderly:push ...contracts

POSITIONAL ARGUMENTS:

  contracts     Addresses and names of contracts that will be verified formatted ContractName=Address 

tenderly-push: Privately pushes contracts to Tenderly
```

## Manual contract verification - Source & compiler config manually provided



## Configuration

This plugin extends the `HardhatConfig` object with 
`project`, `username`, `forkNetwork` and `privateVerification` fields.

This is an example of how to set it:

```js
module.exports = {
    tenderly: {
        project: "",
        username: "",
        forkNetwork: "",
        privateVerification: false,
    }
};
```

## Usage

For this plugin to function you need to create a `config.yaml` file at 
`$HOME/.tenderly/config.yaml` or `%HOMEPATH%\.tenderly\config.yaml` and add an `access_key` field to it:
```yaml
access_key: super_secret_access_key
```

You can find the access token on the [Tenderly dashboard](https://dashboard.tenderly.co/), 
under _Settings -> Authorization_. 

Or if the project belongs to an organization, by going to the Organization page inside the dashboard and navigating to the _Access Keys_ tab in the sidebar.

*Alternatively*, this step can be skipped by doing `tenderly login` on the `tenderly-cli`

After this you can access [Tenderly](https://tenderly.co/) through the Hardhat Runtime Environment anywhere 
you need it (tasks, scripts, tests, etc).
