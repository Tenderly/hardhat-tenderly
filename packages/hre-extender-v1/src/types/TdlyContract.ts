import { Contract, ethers } from "ethers";
import { Libraries } from "hardhat-deploy/types";
// eslint-disable-next-line import/no-extraneous-dependencies
import { Provider, TransactionReceipt } from "@ethersproject/abstract-provider";
// eslint-disable-next-line import/no-extraneous-dependencies
import { Signer } from "@ethersproject/abstract-signer";

import { TenderlyPlugin } from "@tenderly/hardhat-integration";
import { ContractByName } from "./ContractByName";

export class TdlyContract extends Contract {
  [key: string]: any;

  private readonly contractName: string;
  private nativeContract: ethers.Contract;
  private tenderly: TenderlyPlugin;
  private libraries: Libraries | undefined;

  constructor(nativeContract: ethers.Contract, tenderly: TenderlyPlugin, contractName: string, libs?: Libraries) {
    super(nativeContract.address, nativeContract.interface, nativeContract.signer ?? nativeContract.provider ?? null);
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

  public connect(signerOrProvider: Signer | Provider | string): Contract {
    return this.nativeContract.connect(signerOrProvider);
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
