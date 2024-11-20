export class UndefinedChainIdError extends Error {
    constructor(networkName: string) {
        super(`Couldn't find chainId for the network: ${networkName}. \nPlease provide the chainId in the network config object`);
    }
}
