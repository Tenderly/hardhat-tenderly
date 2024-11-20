import { PLUGIN_NAME } from "./constants";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export class UndefinedChainIdError extends Error {
    constructor(networkName: string) {
        super(`Couldn't find chainId for the network: ${networkName}. \nPlease provide the chainId in the network config object`);
    }
}

export class UsernameOrProjectNotProvidedError extends Error {
    constructor() {
        super(`Please provide the username and project fields in the tenderly object in hardhat.config.js`);
    }
}


export async function throwIfUsernameOrProjectNotSet(
  hre: HardhatRuntimeEnvironment,
): Promise<void> {
    if (hre.config.tenderly?.username === undefined) {
        throw new UsernameOrProjectNotProvidedError();
    }
    if (hre.config.tenderly?.project === undefined) {
        throw new UsernameOrProjectNotProvidedError();
    }
}

