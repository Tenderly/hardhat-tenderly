import { Contract, ethers } from "ethers";
import { Libraries } from "hardhat-deploy/types";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { TenderlyPlugin } from "@tenderly/hardhat-integration";
export declare class TdlyContract extends Contract {
    [key: string]: any;
    private readonly contractName;
    private nativeContract;
    private tenderly;
    private libraries;
    constructor(nativeContract: ethers.Contract, tenderly: TenderlyPlugin, contractName: string, libs?: Libraries);
    connect(signerOrProvider: Signer | Provider | string): Contract;
    deployed(): Promise<Contract>;
    private _tdlyVerify;
}
//# sourceMappingURL=TdlyContract.d.ts.map