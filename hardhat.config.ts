import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@tenderly/hardhat-tenderly";
import "@nomicfoundation/hardhat-ignition";
 
import * as dotenv from 'dotenv';
dotenv.config();
 
const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    mainnet: {
      url: process.env.TENDERLY_ADMIN_RPC_URL_1,
      chainId: parseInt(process.env.TENDERLY_CHAIN_ID_1 || "1")
    },
    base: {
      url: process.env.TENDERLY_ADMIN_RPC_URL_8453,
      chainId: parseInt(process.env.TENDERLY_CHAIN_ID_8453 || "8453")
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.TENDERLY_ACCESS_KEY!,
      base: process.env.TENDERLY_ACCESS_KEY!
    },
    customChains: [
      {
        network: "mainnet",
        chainId: parseInt(process.env.TENDERLY_CHAIN_ID_1!),
        urls: {
          apiURL: `${process.env.TENDERLY_ADMIN_RPC_URL_1}/verify`,
          browserURL: process.env.TENDERLY_ADMIN_RPC_URL_1!
        }
      },
      {
        network: "base",
        chainId: parseInt(process.env.TENDERLY_CHAIN_ID_8453!),
        urls: {
          apiURL: `${process.env.TENDERLY_ADMIN_RPC_URL_8453}/verify`,
          browserURL: process.env.TENDERLY_ADMIN_RPC_URL_8453!
        }
      }
    ]
  },
  tenderly: {
    project: process.env.TENDERLY_PROJECT_NAME!,
    username: process.env.TENDERLY_ACCOUNT_NAME!,
    accessKey: process.env.TENDERLY_ACCESS_KEY!
  },
  sourcify: {
    enabled: false
  }
};
 
export default config;
