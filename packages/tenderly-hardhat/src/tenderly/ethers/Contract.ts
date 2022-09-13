import { Contract, ethers } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import { Libraries } from "hardhat-deploy/types";

import { TenderlyPlugin } from "../../type-extensions";
import { ContractByName } from "../types";

export class TdlyContract {
  [key: string]: any;

  private readonly contractName: string;
  private nativeContract: ethers.Contract;
  private tenderly: TenderlyPlugin;
  private libraries: Libraries | undefined;

  constructor(nativeContract: ethers.Contract, tenderly: TenderlyPlugin, contractName: string, libs?: Libraries) {
    this.contractName = contractName;
    this.nativeContract = nativeContract;
    this.tenderly = tenderly;
    this.libraries = libs;

    Object.keys(nativeContract).forEach((key) => {
      if (this[key] !== undefined) {
        return;
      }

      if (key === "deployTransaction") {
        const wait = nativeContract[key].wait;

        nativeContract[key].wait = async (confirmations?: number | undefined): Promise<TransactionReceipt> => {
          const receipt = await wait(confirmations);
          await this._tdlyVerify(receipt.contractAddress);

          return receipt;
        };
      }

      this[key] = nativeContract[key];
    });
  }

  public async deployed(): Promise<Contract> {
    const contract = await this.nativeContract.deployed();
    if (this.nativeContract.deployTransaction === undefined || this.nativeContract.deployTransaction === null) {
      await this._tdlyVerify(contract.address);
    }

    return contract;
  }

  private async _tdlyVerify(address: string) {
    const contPair: ContractByName = {
      name: this.contractName,
      address,
    };
    if (this.libraries !== undefined && this.libraries !== null) {
      contPair.libraries = this.libraries;
    }

    await this.tenderly.persistArtifacts(contPair);
    await this.tenderly.verify(contPair);
  }
}

export interface TransactionReceipt {
  to: string;
  from: string;
  contractAddress: string;
  transactionIndex: number;
  root?: string;
  gasUsed: BigNumber;
  logsBloom: string;
  blockHash: string;
  transactionHash: string;
  logs: Log[];
  blockNumber: number;
  confirmations: number;
  cumulativeGasUsed: BigNumber;
  effectiveGasPrice: BigNumber;
  byzantium: boolean;
  type: number;
  status?: number;
}

export interface Log {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;

  removed: boolean;

  address: string;
  data: string;

  topics: string[];

  transactionHash: string;
  logIndex: number;
}
