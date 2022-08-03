import { Libraries } from "@nomiclabs/hardhat-ethers/types";
import { Contract, ContractFactory, ethers, Signer } from "ethers";

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
    this.nativeContractFactory = nativeContractFactory;
    this.tenderly = tenderly;
    this.contractName = contractName;
    this.libs = libs;

    // tslint:disable-next-line:forin
    for (const attribute in nativeContractFactory) {
      if (this[attribute] !== undefined) {
        continue;
      }

      this[attribute] = nativeContractFactory[attribute];
    }
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

  public async connect(signer: Signer) {
    const contractFactory = this.nativeContractFactory.connect(signer);

    return new TdlyContractFactory(
      contractFactory,
      this.tenderly,
      this.contractName,
      this.libs
    );
  }
}
