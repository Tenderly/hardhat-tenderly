// import * as tdly from "@tenderly/hardhat-tenderly";
import "@tenderly/hardhat-tenderly";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

// tdly.setup({ automaticVerifications: true });

dotenv.config();

const { TENDERLY_PRIVATE_VERIFICATION } = process.env;

const priaveteVerification = TENDERLY_PRIVATE_VERIFICATION === "true";

console.log("Using private verification? ", priaveteVerification, TENDERLY_PRIVATE_VERIFICATION);

const config: HardhatUserConfig = {
  solidity: "0.8.9",

  // networks: {
  //   tenderly: {
  //     chainId: 1,
  //     url: `https://rpc.tenderly.co/fork/${process.env.TENDERLY_FORK_ID ?? ""}`,
  //   },
  // },
  tenderly: {
    project: process.env.TENDERLY_PROJECT ?? "",
    username: process.env.TENDERLY_USERNAME ?? "",
    privateVerification: priaveteVerification,
  },
};

// eslint-disable-next-line import/no-default-export
export default config;
