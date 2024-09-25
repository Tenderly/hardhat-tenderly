import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";
import * as dotenv from "dotenv";
import * as tdly from "@tenderly/hardhat-tenderly";

dotenv.config();

tdly.setup();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
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
    username: process.env.TENDERLY_USERNAME ?? ""
  }
};

export default config;
