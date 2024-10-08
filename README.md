# Hardhat-Tenderly Plugin

The **Hardhat-Tenderly plugin** integrates your Hardhat projects seamlessly with [Tenderly](https://tenderly.co/). This plugin allows you to verify contracts, simulate transactions, debug issues, and monitor your deployments effortlessly.

With Tenderly, contract verification makes the verification information visible within your Tenderly project. You can verify contracts on public networks or choose private verification, which keeps the code visible only within your Tenderly project. Contracts deployed to Tenderly Virtual TestNets are also visible only within the Virtual TestNet. 

>[!NOTE]
> Verification enables the Debugger, Simulator UI, and most Alerts and Web3 actions.

## Setup and Configuration

### Installation

To use this plugin in your Hardhat project, add it as a dependency:

```bash
npm install --save-dev @tenderly/hardhat-tenderly
```

Then, add the plugin to your Hardhat configuration file (`hardhat.config.js` or `hardhat.config.ts`):

```javascript
const tenderly = require("@tenderly/hardhat-tenderly");
// or import if using TypeScript
import * as tenderly from "@tenderly/hardhat-tenderly";
```

Make sure to import `@tenderly/hardhat-tenderly` after other packages, such as `@nomicfoundation/hardhat-toolbox`, `@nomiclabs/hardhat-ethers`, `@openzeppelin/hardhat-upgrades`, etc.

### Plugin Setup

For versions `>=1.10.0` and `>=2.4.0`, calling the `setup` method is not needed.

For versions `<1.10.0` and `<2.4.0`, you must call the `tenderly.setup` method:

```javascript
tenderly.setup({ automaticVerifications: process.env.TENDERLY_AUTOMATIC_VERIFICATION });
```

Automatic verification of proxy contracts works out of the box with versions `>= 2.1.0` and `>= 1.10.0`. For versions `< 2.4.0` and `< 1.10.0`, follow the [automatic proxy verification workaround](/contract-verification/hardhat-proxy-contracts). To avoid the workaround, upgrade the plugin:

```bash
npm update @tenderly/hardhat-tenderly
```

### Configuration

To use the Hardhat-Tenderly plugin, you'll need to set up the following:

- **Username**: The organization or user your Tenderly project belongs to. You either need to be the owner of the project, a collaborator, or a member of the organization.
- **Project**: The project slug.

To get your project and username, refer to [this guide](https://docs.tenderly.co/account/projects/account-project-slug).

```javascript
module.exports = {
  tenderly: {
    username: "your-tenderly-username",
    project: "your-tenderly-project",
    privateVerification: process.env.TENDERLY_PUBLIC_VERIFICATION !== true, // optional, default is false
  },
};
```

### Authentication

To authenticate verification requests, install the Tenderly CLI and run:

```bash
tenderly login
```

## Deployment with Verification

Run the following command to deploy your contract with verification:

```bash
TENDERLY_PUBLIC_VERIFICATION=false \ # Will verify privately. If omitted, verification is private by default.
TENDERLY_AUTOMATIC_VERIFICATION=true \
npx hardhat run scripts/deploy.ts --network mainnet_base
```

## Automatic Verification

You can also automatically verify contracts during deployment without adding any additional code.

>[!TIP]  
> With automatic verification, you must wait for the contract deployment to be confirmed by calling [`deployed()`](https://docs.ethers.org/v5/api/contract/contract/#Contract-deployed) in the case of Ethers 5, or [`waitForDeployment()`](https://docs.ethers.org/v5/api/contract/contract/#Contract-deployed) in the case of Ethers 6.

```javascript
const { ethers } = require("hardhat");

async function main() {
  const MyContract = await ethers.getContractFactory("MyContract");
  const myContract = await (await MyContract.deploy()).deployed();

  console.log("Contract deployed to:", myContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Use the `TENDERLY_AUTOMATIC_VERIFICATION` environment variable when calling deployment scripts to enable automatic verification:

```bash
TENDERLY_PUBLIC_VERIFICATION=false \ # Will verify publicly. If omitted, verification is private.
TENDERLY_AUTOMATIC_VERIFICATION=true \
npx hardhat run scripts/deploy.ts --network mainnet_base
```

## Manual Verification

The Hardhat-Tenderly plugin allows you to explicitly verify contracts in your deployment scripts by using `tenderly.verify`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const MyContract = await ethers.getContractFactory("MyContract");
  const myContract = await MyContract.deploy();

  console.log("Contract deployed to:", myContract.address);

  await hre.tenderly.verify({
    name: "MyContract",
    address: myContract.address,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Use manual verification to:

- Verify deployed contracts
- Verify contracts created by factories
- Be explicit about the verification process

## Version Compatibility

### Versions `>=2.4.0 & >=1.10.0`

The plugin recognizes the `TENDERLY_AUTOMATIC_VERIFICATION` flag and will enable or disable automatic verification accordingly.

### Versions `<2.4.0 & <1.10.0`

You must enable automatic verification for all deployments by adding the following configuration to your Hardhat config and setting the required environment variables when you run Hardhat scripts:

```javascript
tenderly.setup({ automaticVerifications: process.env.TENDERLY_AUTOMATIC_VERIFICATION });
```

## Automatic Proxy Contract Verification

Automatic verification of proxy contracts deployed and upgraded with `hardhat-upgrades` is possible with the following versions of `@tenderly/hardhat-tenderly`:

- **>= 1.10.0**
- **>= 2.1.0**

For versions `<2.4.0` and `<1.10.0`, follow the [automatic proxy verification workaround](/contract-verification/hardhat-proxy-contracts) or upgrade the plugin:

```bash
npm update @tenderly/hardhat-tenderly
```

## Frequently Asked Questions (FAQ)

### I verified my contract publicly but want it to be private. Can I remove the public verification of the contract?

To revert your contract back to private and visible only within your project, please contact our support team via the in-app chat or [support@tenderly.co](mailto:support@tenderly.co). Make sure to provide your username, project, and contract address. Our team will then delete the public verification for the specified contract.

### How do I privately verify contracts from public networks (Mainnet, Holesky, etc.) in Tenderly?

Private verification means that contracts will be visible only to Tenderly users who have access to your project.

To verify privately, set the `config.tenderly.privateVerification` flag in `hardhat.config.ts`. Contracts will be verified publicly unless you specify this flag. We recommend externalizing this configuration via the environment variable `TENDERLY_PUBLIC_VERIFICATION`.

### If I publicly verify a contract on Tenderly, will it still be visible after I delete it from my contracts?

Yes, publicly verified contracts remain visible even after you delete them from your list of contracts. To ensure your contracts are visible only within your project, you can use private verification instead.

## Contribution

We welcome contributions from the community! Feel free to open issues, submit pull requests, or reach out to discuss improvements.

## License

This plugin is licensed under the MIT License.

## Resources

- [Tenderly Documentation](https://docs.tenderly.co/contract-verification)
- [Hardhat Documentation](https://hardhat.org/docs/)