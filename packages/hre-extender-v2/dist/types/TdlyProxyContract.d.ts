import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyPlugin } from "@tenderly/hardhat-integration";
export declare class TdlyProxyContract {
    [key: string]: any;
    private readonly hre;
    private tenderly;
    private proxyContract;
    constructor(hre: HardhatRuntimeEnvironment, tenderly: TenderlyPlugin, proxyContract: ethers.Contract);
    waitForDeployment(): Promise<ethers.Contract>;
    deploymentTransaction(): null | ethers.ContractTransactionResponse;
    getAddress(): Promise<string>;
}
//# sourceMappingURL=TdlyProxyContract.d.ts.map