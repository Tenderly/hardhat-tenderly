import { Contract, ContractFactory, Signer } from "ethers";
import { Libraries } from "@nomiclabs/hardhat-ethers/types";

import { TenderlyPlugin } from "@tenderly/hardhat-tenderly";
import { TdlyContract } from "./TdlyContract";

export class TdlyContractFactory extends ContractFactory {
  [key: string]: any;

  private readonly contractName: string;
  private libs: Libraries | undefined;
  private nativeContractFactory: ContractFactory;
  private tenderly: TenderlyPlugin;

  constructor(
    nativeContractFactory: ContractFactory,
    tenderly: TenderlyPlugin,
    contractName: string,
    libs?: Libraries
  ) {
    super(nativeContractFactory.interface, nativeContractFactory.bytecode, nativeContractFactory.signer);
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

  public connect(signer: Signer) {
    const contractFactory = this.nativeContractFactory.connect(signer);

    return new TdlyContractFactory(contractFactory, this.tenderly, this.contractName, this.libs);
  }
}

const isGetter = (x: any, name: string): any => ((Object.getOwnPropertyDescriptor(x, name) !== null || {}) as any).get;
const isFunction = (x: any, name: string): boolean => typeof x[name] === "function";
const deepFunctions = (x: any): string[] => {
  if (x && x !== Object.prototype) {
    return Object.getOwnPropertyNames(x)
      .filter((name: string) => isGetter(x, name) !== null || isFunction(x, name))
      .concat(deepFunctions(Object.getPrototypeOf(x)) ?? []);
  }
  return [];
};
const distinctDeepFunctions = (x: any) => Array.from(new Set(deepFunctions(x)));
export const classFunctions = (x: any) =>
  distinctDeepFunctions(x).filter((name: string) => name !== "constructor" && name.indexOf("__") === -1);
