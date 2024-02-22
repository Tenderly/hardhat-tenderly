import { Contract, ContractFactory, Signer } from "ethers";
import { Libraries } from "@nomicfoundation/hardhat-ethers/types";
import { TenderlyPlugin } from "@tenderly/hardhat-integration";
export declare class TdlyContractFactory {
    [key: string]: any;
    private readonly contractName;
    private readonly libs;
    private readonly nativeContractFactory;
    private readonly tenderly;
    constructor(nativeContractFactory: ContractFactory, tenderly: TenderlyPlugin, contractName: string, libs?: Libraries);
    deploy(...args: any[]): Promise<Contract>;
    connect(signer: Signer): TdlyContractFactory;
    getLibs(): Libraries | undefined;
    getContractName(): string;
    getNativeContractFactory(): ContractFactory;
}
//# sourceMappingURL=TdlyContractFactory.d.ts.map