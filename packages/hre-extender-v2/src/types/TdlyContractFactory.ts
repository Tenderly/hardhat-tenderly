import { Contract, ContractFactory, Signer } from "ethers";
import { Libraries } from "@nomicfoundation/hardhat-ethers/types";

import { TenderlyPlugin } from "@tenderly/hardhat-tenderly";
import { TdlyContract } from "./TdlyContract";

export class TdlyContractFactory {
  [key: string]: any;

  private readonly contractName: string;
  private readonly libs: Libraries | undefined;
  private readonly nativeContractFactory: ContractFactory;
  private readonly tenderly: TenderlyPlugin;

  constructor(
    nativeContractFactory: ContractFactory,
    tenderly: TenderlyPlugin,
    contractName: string,
    libs?: Libraries,
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

    return new TdlyContract(
      contract as Contract,
      this.tenderly,
      this.contractName,
      this.libs,
    ) as unknown as Contract;
  }

  public connect(signer: Signer) {
    const contractFactory = this.nativeContractFactory.connect(signer);

    return new TdlyContractFactory(
      contractFactory,
      this.tenderly,
      this.contractName,
      this.libs,
    );
  }

  public getLibs(): Libraries | undefined {
    return this.libs;
  }

  public getContractName(): string {
    return this.contractName;
  }

  public getNativeContractFactory(): ContractFactory {
    return this.nativeContractFactory;
  }
}

const classFunctions = (x: any) =>
  distinctDeepFunctions(x).filter(
    (name: string) => name !== "constructor" && name.indexOf("__") === -1,
  );

const distinctDeepFunctions = (x: any) => Array.from(new Set(deepFunctions(x)));

const deepFunctions = (x: any): string[] => {
  if (x && x !== Object.prototype) {
    return Object.getOwnPropertyNames(x)
      .filter(
        (name: string) => isGetter(x, name) !== null || isFunction(x, name),
      )
      .concat(deepFunctions(Object.getPrototypeOf(x)) ?? []);
  }
  return [];
};

const isGetter = (x: any, name: string): any =>
  ((Object.getOwnPropertyDescriptor(x, name) !== null || {}) as any).get;

const isFunction = (x: any, name: string): boolean =>
  typeof x[name] === "function";
