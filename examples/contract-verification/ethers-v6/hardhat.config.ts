import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-toolbox";
import "@tenderly/hardhat-tenderly";
import * as dotenv from "dotenv";

dotenv.config();

import { HardhatUserConfig } from "hardhat/types/config";

const { TENDERLY_PRIVATE_VERIFICATION, TENDERLY_AUTOMATIC_VERIFICATION } =
  process.env;

const privateVerification = TENDERLY_PRIVATE_VERIFICATION === "true";
const automaticVerifications = TENDERLY_AUTOMATIC_VERIFICATION === "true";

console.log("Using private verification?", privateVerification);
console.log("Using automatic verification?", automaticVerifications);
console.log(
  "Using automatic population of hardhat-verify `etherscan` configuration? ",
  process.env.TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG === "true",
);

const config: HardhatUserConfig = {
  solidity: "0.8.23",
  networks: {
    my_tenderly_testnet: {
      // or any other custom network name
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
