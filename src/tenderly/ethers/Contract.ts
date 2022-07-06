import { Contract, ethers } from "ethers";
import { Libraries } from "hardhat-deploy/dist/types";

import { TenderlyPlugin } from "../../type-extensions";

export class TdlyContract {
  [key: string]: any;

  private readonly contractName: string;
  private nativeContract: ethers.Contract;
  private tenderly: TenderlyPlugin;
  private libraries: Libraries | undefined;

  constructor(
    nativeContract: ethers.Contract,
    tenderly: TenderlyPlugin,
    contractName: string,
    libs?: Libraries
  ) {
    this.contractName = contractName;
    this.nativeContract = nativeContract;
    this.tenderly = tenderly;
    this.libraries = libs;

    Object.keys(nativeContract).forEach(key => {
      if (this[key] !== undefined) {
        return;
      }

      this[key] = nativeContract[key];
    });
  }

  public async deployed(): Promise<Contract> {
    const contract = await this.nativeContract.deployed();
    const contPair = {
      name: this.contractName,
      address: contract.address,
      libraries: this.libraries
    };

    await this.tenderly.persistArtifacts(contPair);
    await this.tenderly.verify(contPair);
    return contract;
  }
}
