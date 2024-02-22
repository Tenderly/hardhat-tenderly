import { ethers } from "ethers";
import { DeployContractOptions } from "@nomicfoundation/hardhat-ethers/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
export declare function extendEthers(hre: HardhatRuntimeEnvironment): void;
export declare function deployContract(name: string, signerOrOptions?: ethers.Signer | DeployContractOptions): Promise<ethers.Contract>;
//# sourceMappingURL=extend-ethers.d.ts.map