export const PluginName = "hardhat-tenderly";

export const DefaultChainId = "31337";

export const NetworkMap: Record<string, string> = {
    kovan: "42",
    goerli: "5",
    mainnet: "1",
    rinkeby: "4",
    ropsten: "3",
    matic: "137",
    mumbai: "80001",
    xdai: "100",
    poa: "99",
    bsc: "56",
    "bsc-testnet": "97",
    rsk: "30",
    "rsk-testnet": "31",
    avalanche: "43114",
    "avalanche-testnet": "43113"
};

export const ReverseNetworkMap: Record<string, string> = {
    "42": "kovan",
    "5": "goerli",
    "1": "mainnet",
    "4": "rinkeby",
    "3": "ropsten",
    "80001": "matic-mumbai",
    "137": "matic-mainnet",
    "100": "xdai",
    "99": "poa",
    "56": "binance",
    "97": "rialto",
    "30": "rsk",
    "31": "rsk-testnet",
    "43114": "c-chain",
    "43113": "c-chain-testnet"
};
