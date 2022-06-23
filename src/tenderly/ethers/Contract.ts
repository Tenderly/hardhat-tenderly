import { Contract, ethers } from "ethers";

import { TenderlyPlugin } from "../../type-extensions";

export class TdlyContract {
  [key: string]: any;

  private readonly contractName: string;
  private nativeContract: ethers.Contract;
  private tenderly: TenderlyPlugin;

  constructor(
    nativeContract: ethers.Contract,
    tenderly: TenderlyPlugin,
    contractName: string
  ) {
    this.contractName = contractName;
    this.nativeContract = nativeContract;
    this.tenderly = tenderly;

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
      address: contract.address
    };
    await this.tenderly.persistArtifacts(contPair);
    await this.tenderly.verify(contPair);
    return contract;
  }
}
