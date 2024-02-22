import { Contract, ContractFactory, Signer } from "ethers";
import { Libraries } from "@nomiclabs/hardhat-ethers/types";
import { TenderlyPlugin } from "@tenderly/hardhat-integration";
export declare class TdlyContractFactory extends ContractFactory {
    [key: string]: any;
    private readonly contractName;
    private libs;
    private nativeContractFactory;
    private tenderly;
    constructor(nativeContractFactory: ContractFactory, tenderly: TenderlyPlugin, contractName: string, libs?: Libraries);
    deploy(...args: any[]): Promise<Contract>;
    connect(signer: Signer): TdlyContractFactory;
}
export declare const classFunctions: (x: any) => string[];
//# sourceMappingURL=TdlyContractFactory.d.ts.map