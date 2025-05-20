import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as tdly from "@tenderly/hardhat-tenderly";
 
const config: HardhatUserConfig = {
solidity: "0.8.19",
networks: {
mainnet_base: {
url: "https://base.gateway.tenderly.co",
chainId: 8453
},
tenderly_base_testnet: {
// your Tenderly TestNet RPC
url: "https://virtual.base.rpc.tenderly.co/872ac073-1de1-4422-b01d-8d057781d77d",
chainId: 888
}
},
tenderly: {
username: "Your account slug",
project: "Your project slug",
 
// Mainnet contract verification visible only in Tenderly.
// Omitting or setting to `false` makes it visible to the whole world.
// Alternatively, configure verification visibility using
// an environment variable `TENDERLY_PUBLIC_VERIFICATION`.
privateVerification: process.env.TENDERLY_PUBLIC_VERIFICATION !== 'true',
},
etherscan:{
apiKey: "YOUR_API_KEY",
customChains: [
{
network: "tenderly_base_testnet",
chainId: 888,
urls:{
apiURL: `https://virtual.base.rpc.tenderly.co/872ac073-1de1-4422-b01d-8d057781d77d/verify/etherscan`,
browserURL: "https://virtual.base.rpc.tenderly.co/872ac073-1de1-4422-b01d-8d057781d77d"
}
}
]
},
};
 
export default config;
