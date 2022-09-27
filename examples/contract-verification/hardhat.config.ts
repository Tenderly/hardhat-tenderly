import { HardhatUserConfig } from "hardhat/config";
// import { HardhatNetworkAccountsUserConfig } from "hardhat/types";
import * as tdly from "@tenderly/hardhat-tenderly";
import * as dotenv from "dotenv";

dotenv.config();

const { TENDERLY_AUTOMATIC_VERIFICATION, TENDERLY_PRIVATE_VERIFICATION, TENDERLY_FORK_ID } = process.env;

const automaticVerification = TENDERLY_AUTOMATIC_VERIFICATION === "true";
const priaveteVerification = TENDERLY_PRIVATE_VERIFICATION === "true";

console.log("Using automatic verification? ", automaticVerification, TENDERLY_AUTOMATIC_VERIFICATION);

console.log("Using private verification? ", priaveteVerification, TENDERLY_PRIVATE_VERIFICATION);

tdly.setup({ automaticVerifications: automaticVerification });

const config: HardhatUserConfig = {
  solidity: "0.8.9",

  networks: {
    // ropsten: {
    // url: process.env.ROPSTEN_URL,
    // accounts: (process.env.ROPSTEN_PRIVATE_KEY as HardhatNetworkAccountsUserConfig) ?? undefined,
    // },
    // tenderly: {
    //   url: `https://rpc.tenderly.co/fork/${TENDERLY_FORK_ID ?? ""}`,
    // url: `http://127.0.0.1:1337`,
    // },
  },
  tenderly: {
    project: process.env.TENDERLY_PROJECT ?? "",
    username: process.env.TENDERLY_USERNAME ?? "",
    privateVerification: priaveteVerification,
  },
};

// eslint-disable-next-line import/no-default-export
export default config;
