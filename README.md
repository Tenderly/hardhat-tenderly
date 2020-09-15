# buidler-tenderly

[Buidler](http://getbuidler.com) plugin for integration with [Tenderly](https://tenderly.co/). 

## What

This plugin will help you verify your Solidity contracts, as well as allow you to 
privately push contracts to [Tenderly](https://tenderly.co/).

## Installation

```bash
npm install --save-dev @tenderly/buidler-tenderly
```

And add the following statement to your `buidler.config.js`:

```js
usePlugin("@tenderly/buidler-tenderly");
```

## Tasks

This plugin adds the _`tenderly-verify`_ task to Buidler:
```
Usage: buidler [GLOBAL OPTIONS] tenderly-verify ...contracts

POSITIONAL ARGUMENTS:

  contracts     Addresses and names of contracts that will be verified formatted ContractName=Address 

tenderly-verify: Verifies contracts on Tenderly
```

And the `tenderly-push` task:
```
Usage: buidler [GLOBAL OPTIONS] tenderly-push ...contracts

POSITIONAL ARGUMENTS:

  contracts     Addresses and names of contracts that will be verified formatted ContractName=Address 

tenderly-push: Privately pushes contracts to Tenderly
```

## Environment extensions

This plugin extends the Buidler Runtime Environment by adding a `tenderly` field
whose type is `Tenderly`.

This field has the `veriftContract` and `pushContract` methods.

## Configuration

This plugin extends the `BuidlerConfig` object with an optional 
`tenderlyProject` and `tenderlyUsername` fields.

This is an example of how to set it:

```js
module.exports = {
  tenderlyProject: "",
  tenderlyUsername: "",
};
```

## Usage

For this plugin to function you need to create a `config.yaml` file at 
`$HOME/.tenderly/config.yaml` or `$HOME\\.tenderly\\config.yaml` and add an `access_token` field to it:
```yaml
access_token: 123
```

You can find the access token on the [Tenderly dashboard](https://dashboard.tenderly.co/), 
under _Settings -> Authorization_.

*Alternatively*, this step can be skipped by doing `tenderly login` on the `tenderly-cli`

After this you can access [Tenderly](https://tenderly.co/) through the Buidler Runtime Environment anywhere 
you need it (tasks, scripts, tests, etc).

## TypeScript support

You need to add this to your `tsconfig.json`'s `files` array: 
`"node_modules/@tenderly/buidler-tenderly/src/type-extensions.d.ts"`
