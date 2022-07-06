import { Libraries } from "@nomiclabs/hardhat-ethers/types";
import { Contract, ethers } from "ethers";

import { TenderlyPlugin } from "../../type-extensions";

import { TdlyContract } from "./Contract";

export class TdlyContractFactory {
  [key: string]: any;

  private readonly contractName: string;
  private libs: Libraries | undefined;
  private nativeContractFactory: ethers.ContractFactory;
  private tenderly: TenderlyPlugin;

  constructor(
    nativeContractFactory: ethers.ContractFactory,
    tenderly: TenderlyPlugin,
    contractName: string,
    libs?: Libraries
  ) {
    this.contractName = contractName;
    this.nativeContractFactory = nativeContractFactory;
    this.tenderly = tenderly;
    this.libs = libs;

    Object.keys(nativeContractFactory).forEach(key => {
      if (this[key] !== undefined) {
        return;
      }

      this[key] = nativeContractFactory[key];
    });
  }

  public async deploy(...args: any[]): Promise<Contract> {
    const contract = await this.nativeContractFactory.deploy(...args);

    return (new TdlyContract(
      contract,
      this.tenderly,
      this.contractName,
      this.libs
    ) as unknown) as Contract;
  }
}
