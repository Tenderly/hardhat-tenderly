import { Contract, ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import { Libraries } from "@nomicfoundation/hardhat-ethers/types";
import { TenderlyPlugin } from "@tenderly/hardhat-integration";
export declare class TdlyContract {
    [key: string]: any;
    private readonly contractName;
    private nativeContract;
    private tenderly;
    private readonly libraries;
    constructor(nativeContract: ethers.Contract, tenderly: TenderlyPlugin, contractName: string, libs?: Libraries);
    waitForDeployment(): Promise<Contract>;
    deploymentTransaction(): null | ethers.ContractTransactionResponse;
    getAddress(): Promise<string>;
    private _tdlyVerify;
}
export interface TransactionReceipt {
    to: string;
    from: string;
    contractAddress: string;
    transactionIndex: number;
    root?: string;
    gasUsed: BigNumber;
    logsBloom: string;
    blockHash: string;
    transactionHash: string;
    logs: Log[];
    blockNumber: number;
    confirmations: number;
    cumulativeGasUsed: BigNumber;
    effectiveGasPrice: BigNumber;
    byzantium: boolean;
    type: number;
    status?: number;
}
export interface Log {
    blockNumber: number;
    blockHash: string;
    transactionIndex: number;
    removed: boolean;
    address: string;
    data: string;
    topics: string[];
    transactionHash: string;
    logIndex: number;
}
//# sourceMappingURL=TdlyContract.d.ts.map