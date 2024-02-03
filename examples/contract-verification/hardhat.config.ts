import * as tdly from "@tenderly/hardhat-tenderly";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/types/config";

const { TENDERLY_PRIVATE_VERIFICATION, TENDERLY_AUTOMATIC_VERIFICATION } =
  process.env;

const privateVerification = TENDERLY_PRIVATE_VERIFICATION === "true";
const automaticVerifications = TENDERLY_AUTOMATIC_VERIFICATION === "true";

console.log(
  "Using private verification? ",
  privateVerification,
  TENDERLY_PRIVATE_VERIFICATION,
);
console.log(
  "Using automatic verification? ",
  automaticVerifications,
  TENDERLY_AUTOMATIC_VERIFICATION,
);

tdly.setup({ automaticVerifications });

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.23",
  networks: {
    fork: {
      // or any other name
      url: `${process.env.TENDERLY_FORK_RPC_URL ?? ""}`,
    },
    "fork-v1": {
      // or any other name
      url: `${process.env.TENDERLY_FORK_V1_RPC_URL ?? ""}`,
    },
    devnet: {
      // or any other name
      url: `${process.env.TENDERLY_DEVNET_RPC_URL ?? ""}`,
    },
    "devnet-v1": {
      // or any other name
      url: `${process.env.TENDERLY_DEVNET_V1_RPC_URL ?? ""}`,
    },
    testnet: {
      url: `${process.env.TENDERLY_TESTNET_RPC_URL ?? ""}`,
    },
    sepolia: {
      url: `${process.env.SEPOLIA_URL ?? ""}`,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY ?? ""],
    },
  },
  tenderly: {
    project: process.env.TENDERLY_PROJECT ?? "",
    username: process.env.TENDERLY_USERNAME ?? "",
    privateVerification,
  },
  // etherscan: {
  //   apiKey: {
  //     testnet: process.env.TENDERLY_API_KEY ?? "",
  //     devnet: process.env.TENDERLY_API_KEY ?? "",
  //     "devnet-v1": process.env.TENDERLY_API_KEY ?? "",
  //     fork: process.env.TENDERLY_API_KEY ?? "",
  //     "fork-v1": process.env.TENDERLY_API_KEY ?? "",
  //     // sepolia: process.env.ETHERSCAN_API_KEY ?? "",
  //     sepolia: process.env.TENDERLY_API_KEY ?? "",
  //   },
  //   customChains: [
  //     {
  //       network: "testnet",
  //       chainId: 258,
  //       urls: {
  //         apiURL:
  //           `${tenderlyApiUrl}` +
  //           `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
  //           `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
  //           `etherscan/verify/` +
  //           `testnet/${process.env.TENDERLY_TESTNET_RESOURCE_ID ?? ""}`,
  //         // TODO(dusan): frontend should make this work in an etherscan format in order to have display links
  //         browserURL: "custom-invalid-url",
  //       },
  //     },
  //     {
  //       network: "devnet",
  //       chainId: 257,
  //       urls: {
  //         apiURL:
  //           `${tenderlyApiUrl}` +
  //           `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
  //           `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
  //           `etherscan/verify/` +
  //           `devnet/${process.env.TENDERLY_DEVNET_RESOURCE_ID ?? ""}`,
  //         // TODO(dusan): frontend should make this work in an etherscan format in order to have display links
  //         browserURL: "custom-invalid-url",
  //       },
  //     },
  //     {
  //       network: "devnet-v1",
  //       chainId: 997,
  //       urls: {
  //         apiURL:
  //           `${tenderlyApiUrl}` +
  //           `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
  //           `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
  //           `etherscan/verify/` +
  //           `devnet/${process.env.TENDERLY_DEVNET_V1_RESOURCE_ID ?? ""}`,
  //         // TODO(dusan): frontend should make this work in an etherscan format in order to have display links
  //         browserURL: "custom-invalid-url",
  //       },
  //     },
  //     {
  //       // TODO(dusan): forks can't change chainID. Write it in the documentation.
  //       network: "fork",
  //       chainId: 1001,
  //       urls: {
  //         apiURL:
  //           `${tenderlyApiUrl}` +
  //           `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
  //           `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
  //           `etherscan/verify/` +
  //           `fork/${process.env.TENDERLY_FORK_RESOURCE_ID ?? ""}`,
  //         // TODO(dusan): frontend should make this work in an etherscan format in order to have display links
  //         browserURL: "custom-invalid-url",
  //       },
  //     },
  //     {
  //       // TODO(dusan): forks can't change chainID. Write it in the documentation.
  //       network: "fork-v1",
  //       chainId: 998, // used to be 1
  //       urls: {
  //         apiURL:
  //           `${tenderlyApiUrl}` +
  //           `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
  //           `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
  //           `etherscan/verify/` +
  //           `fork/${process.env.TENDERLY_FORK_V1_RESOURCE_ID ?? ""}`,
  //         // TODO(dusan): frontend should make this work in an etherscan format in order to have display links
  //         browserURL: "custom-invalid-url",
  //       },
  //     },
  //     {
  //       network: "sepolia",
  //       chainId: 11155111,
  //       urls: {
  //         apiURL:
  //           `${tenderlyApiUrl}` +
  //           `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
  //           `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
  //           `etherscan/verify/` +
  //           `network/11155111`,
  //         browserURL: "https://sepolia.etherscan.io",
  //       },
  //     },
  //   ],
  // },
};

// eslint-disable-next-line import/no-default-export
export default config;
