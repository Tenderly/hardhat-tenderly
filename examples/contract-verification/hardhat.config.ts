import * as tdly from "@tenderly/hardhat-tenderly";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-toolbox";

import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/types/config";

const { TENDERLY_PRIVATE_VERIFICATION, TENDERLY_AUTOMATIC_VERIFICATION } =
  process.env;

const privateVerification = TENDERLY_PRIVATE_VERIFICATION === "true";
const automaticVerifications = TENDERLY_AUTOMATIC_VERIFICATION === "true";

tdly.setup({ automaticVerifications });

dotenv.config();

console.log("Using private verification?", privateVerification);
console.log("Using automatic verification?", automaticVerifications);
console.log(
  "Using automatic population of hardhat-verify `etherscan` configuration? ",
  process.env.AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG === "true",
);

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
};

// eslint-disable-next-line import/no-default-export
export default config;
