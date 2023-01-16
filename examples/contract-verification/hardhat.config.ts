import * as tdly from "@tenderly/hardhat-tenderly";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

const { TENDERLY_PRIVATE_VERIFICATION, TENDERLY_AUTOMATIC_VERIFICATION } = process.env;

const privateVerification = TENDERLY_PRIVATE_VERIFICATION === "true";
const automaticVerifications = TENDERLY_AUTOMATIC_VERIFICATION === "true";

console.log("Using private verification? ", privateVerification, TENDERLY_PRIVATE_VERIFICATION);
console.log("Using automatic verification? ", automaticVerifications, TENDERLY_AUTOMATIC_VERIFICATION);

tdly.setup({ automaticVerifications });

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.17",

  networks: {
    tenderly: {
      url: `https://rpc.tenderly.co/fork/${process.env.TENDERLY_FORK_ID ?? ""}`,
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
