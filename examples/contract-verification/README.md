# Hardhat + Tenderly Contract Verification

This repo demonstrates deployment and verification of Smart Contracts in Tenderly platform, using:

- **Tenderly Hardhat plugin** to perform verification using Ethers in several ways (automatic and manual). There are 18 different possibilities you can play around with.

To learn more explore [Tenderly documentation](https://docs.tenderly.co/monitoring/smart-contract-verification).

# The examples

There are two example contracts (`Greeter.sol` and `Calculator.sol`). Their build scripts are located in:

- `scripts/greeter/`, deploying the classical Greeter.sol contract.
- `scripts/calculator`, deploying `Calculator.sol` and `Maths.sol` - a library used by the contract.

From these examples, you can learn:

- How to verify a Smart Contract referencing a non-deployed library: Greeter uses **non-deployed** `hardhat/console.log`.
- How to verify a Smart Contract referencing an library deployed on-chain: Calculator uses **deployed** `Maths.sol` library.

# Login

Run:

```bash
yarn add --dev @tenderly/hardhat-tenderly@1.2.0-beta.1
```

To use your local installation of Tenderly, you need to use `npx` to run it (i.e. `npx tenderly`).

First, we need to log in. To do so, run:

```
npx tenderly login
```

It will redirect you to the Tenderly dashboard, where you should create an access token and paste it into the console prompt.

# Virtual Network

`@tenderly/hardhat-tenderly@1.2.0-beta.1` comes built-in with **Virtual Network**, a local Ethereum EVM based network node designed for development. It allows you to deploy your contracts, run your tests and debug your code on Tenderly dashboard.

To list all supported networks that can be used to spin up a virtual network run:

```bash
npx tenderly networks
```

## Running Virtual Network

Run:

```
> npx tenderly vnet
  // Project and username/organization slug on which you want to create a virtual network
- Tenderly project slug: <your project slug>
- Tenderly username/organization slug: <your username/organization slug>

  // Network that you want to run as virtual network. In this example we use "1" that refers to "mainnet"
- Network name (see `npx tenderly networks` for list of supported networks): 1

  // Block number form which block you want to fork provided network
- Network block number: latest

// And at the end, it will spin up a new virtual network and create a "vnet.template.json" config file
// at the root of your project. That file will be used next time when you run "npx tenderly vnet"
// to load information from above if you want to have more templates stored with different settings
// you can use them when you want to start a new virtual network using the "--template" flag.
// Example: ("npx tenderly vnet --template <path to file>")
Forwarding: http://127.0.0.1:1337 --> https://rpc.tenderly.co/vnet/{{vnet_id}}
```

**_Note: Virtual networks are short-lived nodes made for development purposes so their lifetime is 24 hours after that it will be shut down, or if a virtual network living console is shut down it will shut down that virtual network._**

Then, just connect your wallet or application to http://127.0.0.1:1337.

To do that in hardhat you need to extend `hardhat.config` adding tenderly virtual network url(`http://127.0.0.1:1337`):

```js
{
  networks: {
    tenderly: {
      url: "http://127.0.0.1:1337"
    }
  }
  ...
}
```

# Environment setup

This example requires some environment variables:

- The **provider access** and **tenderly access** parameters should be placed in an .env file.
- Run configuration should be set on per-run basis. This allows us to run the same deployment script in public and private mode or on a fork, without changing any code. These values are used only in hardhat.config.ts. See [Building and verifying](#biuilding-and-verifying-greeter-and-environment-variables) section for more information.

Run the following script to to get an `.env` file initialized with placeholders, necessary for running the examples:

```bash
cat .tpl.env
cp .tpl.env .env
```

To get going, run

```
yarn install
```

Try running automatic verification:

```bash
TENDERLY_AUTOMATIC_VERIFICATION=true \
hardhat run scripts/greeter/automatic.ts --network ropsten
```

## Biuilding and Verifying Greeter and environment variables

The `/scripts/greeter` contains 4 deployment scripts that illustrate the 3 methods of verification (automatic, manual simple, manual advanced) and verification of a contract deployed on a Tenderly Fork. The `scripts/calculator` example has the same structure.

| Verification method    | Script                             |
| ---------------------- | ---------------------------------- |
| Automatic verification | `scripts/greeter/automatic.ts`     |
| Manual simple          | `scripts/greeter/manual-simple.ts` |
| Manual advanced        | `scripts/greeter/manual-simple.ts` |
| Fork                   | `scripts/greeter/fork.ts`          |

For example, to run the automatic verification example, you have to run it with [`TENDERLY_AUTOMATIC_VERIFICATION`](#modes-of-verification-public-private-and-fork) variable:

```bash
TENDERLY_AUTOMATIC_VERIFICATION=true \
hardhat run scripts/greeter/automatic.ts --network ropsten
```

And to run the manual simple with private verification, you'd paste this:

```
TENDERLY_PRIVATE_VERIFICATION=true \
TENDERLY_AUTOMATIC_VERIFICATION=false \
hardhat run scripts/greeter/manual-simple.ts --network ropsten
```

Don't worry, we generated [Run scripts](#run-scripts) to speed things up.

### Modes of verification: `public`, `private`, and `fork`

- To easily switch between private and public verification use `TENDERLY_PRIVATE_VERIFICATION`.
- Default: `false`, contracts are verified publically.
- To run a private verification set `TENDERLY_PRIVATE_VERIFICATION=true`. Any other value is considered not true.

### Tenderly Plugin verification methods: automatic and manual

- Tenderly Hardhat plugin runs with automatic verifications **enabled by default** unless explicitly configured otherwise. See hardhat config line 31.
- To control if you're automatic or manual verification, use `TENDERLY_AUTOMATIC_VERIFICATION`.
- Default: `false`
- To run an automatic verification set `TENDERLY_AUTOMATIC_VERIFICATION=true`

## Run scripts

The pre-populated (generated) scripts in package.json are there to help you quickly run a particular build (out of 18 possibilities), so you don't need to specify environment variables and the tartet deployment script every time you're trying stuff out.

You can choose

| category  | Meaning                                | options                                         |
| --------- | -------------------------------------- | ----------------------------------------------- |
| `example` | Smart contract to verify               | `greeter`, `calculator`                         |
| `mode`    | In one of 3 modes of verification      | `public`, `private`, `fork`                     |
| `method`  | Using one of 3 methods of verification | `automatic`, `manual-simple`, `manual-advanced` |

To run `private` verification of the `Greeter` using `manual-simple` method, you need to run the following:

```
yarn run private:greeter:manual-simple --network ropsten
yarn run fork:calculatr:manual-advanced
```

When running against a specific network, you must add `--network <NETWORK_NAME>`.
The `fork:` scripts have `--network tenderly` already included.
