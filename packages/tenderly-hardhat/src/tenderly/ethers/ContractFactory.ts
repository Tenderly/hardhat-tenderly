import {Contract, ContractFactory, ContractInterface, Signer} from "ethers";
import { Libraries } from "@nomiclabs/hardhat-ethers/types";

import { classFunctions } from "../../utils/util";
import { TenderlyPlugin } from "../../type-extensions";
import { TdlyContract } from "./Contract";

export class TdlyContractFactory {
  [key: string]: any;

  private static readonly contractName: string;
  private static libs: Libraries | undefined;
  private nativeContractFactory: ContractFactory;
  private static tenderly: TenderlyPlugin;

  constructor(
    nativeContractFactory: ContractFactory,
    tenderly: TenderlyPlugin,
    contractName: string,
    libs?: Libraries
  ) {
    this.nativeContractFactory = nativeContractFactory;
    this.tenderly = tenderly;
    this.contractName = contractName;
    this.libs = libs;

    for (const attribute in Object.assign(nativeContractFactory)) {
      if (this[attribute] !== undefined) {
        continue;
      }
      this[attribute] = (nativeContractFactory as any)[attribute];
    }

    classFunctions(nativeContractFactory).forEach((funcName: string) => {
      if (this[funcName] !== undefined) {
        return;
      }
      this[funcName] = (nativeContractFactory as any)[funcName];
    });
  }

  public async deploy(...args: any[]): Promise<Contract> {
    const contract = await this.nativeContractFactory.deploy(...args);

    return new TdlyContract(contract, this.tenderly, this.contractName, this.libs) as unknown as Contract;
  }

  public static getContract(address: string, contractInterface: ContractInterface, signer?: Signer): Contract {
    const contract = ContractFactory.getContract(address, contractInterface, signer);
    
    return new TdlyContract(contract, this.tenderly, this.contractName, this.libs) as unknown as Contract;
  }

  public connect(signer: Signer) {
    const contractFactory = this.nativeContractFactory.connect(signer);

    return new TdlyContractFactory(contractFactory, this.tenderly, this.contractName, this.libs);
  }
}
