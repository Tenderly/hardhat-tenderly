import * as tdly from "@tenderly/hardhat-tenderly";
import "@nomicfoundation/hardhat-ethers";

import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

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
  solidity: "0.8.17",
  networks: {
    my_tenderly_fork_1: {
      // or any other name
      url: `${process.env.TENDERLY_FORK_RPC_URL ?? ""}`,
    },
    my_tenderly_devnet_1: {
      // or any other name
      url: `${process.env.TENDERLY_DEVNET_RPC_URL_1 ?? ""}`,
    },
    my_tenderly_devnet_2: {
      // or any other name
      url: `${process.env.TENDERLY_DEVNET_RPC_URL_2 ?? ""}`,
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
