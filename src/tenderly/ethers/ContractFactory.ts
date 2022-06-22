import { Contract, ethers } from "ethers";

import { TenderlyPlugin } from "../../type-extensions";

export class TdlyContractFactory {
  [key: string]: any;

  private readonly contractName: string;
  private nativeContractFactory: ethers.ContractFactory;
  private tenderly: TenderlyPlugin;

  constructor(
    nativeContractFactory: ethers.ContractFactory,
    tenderly: TenderlyPlugin,
    contractName: string
  ) {
    this.contractName = contractName;
    this.nativeContractFactory = nativeContractFactory;
    this.tenderly = tenderly;

    Object.keys(nativeContractFactory).forEach(key => {
      if (this[key] !== undefined) {
        return;
      }

      this[key] = nativeContractFactory[key];
    });
  }

  public async deploy(...args: any[]): Promise<Contract> {
    const contract = await this.nativeContractFactory.deploy(...args);

    await this.tenderly.verify({
      name: this.contractName,
      address: contract.address
    });
    return contract;
  }
}
