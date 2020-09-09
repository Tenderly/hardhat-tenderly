import {BuidlerRuntimeEnvironment} from "@nomiclabs/buidler/types";
import {NetworkMap} from "./index";
import {
  verifyContract as verifyTenderlyContracts,
  pushContract as pushTenderlyContracts
} from "./tenderly/TenderlyService"

import {ContractByName, TenderlyContract, TenderlyContractUploadRequest} from "./tenderly/types";

export class Tenderly {
  env: BuidlerRuntimeEnvironment;

  constructor(bre: BuidlerRuntimeEnvironment) {
    this.env = bre
  }

  public async verifyContract(...contracts) {
    const flatContracts: ContractByName[] = contracts.reduce((accumulator, value) => accumulator.concat(value), []);

    const requestData = await this.filterContracts(flatContracts)

    if (requestData == null) {
      console.log("Verification failed")
      return
    }

    try {
      await verifyTenderlyContracts(requestData)
    } catch (err) {
      console.log(err.message)
    }
  }

  public async pushContract(...contracts) {
    const flatContracts: ContractByName[] = contracts.reduce((accumulator, value) => accumulator.concat(value), []);

    const requestData = await this.filterContracts(flatContracts)

    if (this.env.config["projectSlug"] == undefined) {
      console.log("Error in tenderly-buidler: Please provide the projectSlug field in buidler.config.js")
      return
    }

    if (this.env.config["tenderlyUsername"] == undefined) {
      console.log("Error in tenderly-buidler: Please provide the tenderlyUsername field in buidler.config.js")
      return
    }

    if (requestData == null) {
      console.log("Push failed")
      return
    }

    try {
      await pushTenderlyContracts(requestData, this.env.config["projectSlug"], this.env.config["tenderlyUsername"])
    } catch (err) {
      console.log(err.message)
    }
  }

  private async filterContracts(flatContracts: ContractByName[]): Promise<TenderlyContractUploadRequest | null> {
    let contract: ContractByName
    const requestData = await this.getContractData()

    for (contract of flatContracts) {
      let network = this.env.buidlerArguments.network != "buidlerevm" ? this.env.buidlerArguments.network : contract.network
      if (network == undefined) {
        console.log("Error in tenderly-buidler: Please provide a network via the buidler --network argument or directly in the contract")
        return null
      }

      const index = requestData.contracts.findIndex(requestContract => requestContract.contractName === contract.name)
      if (index == -1) {
        continue
      }
      requestData.contracts[index].networks = {
        [NetworkMap[network]]: {
          address: contract.address
        }
      }
    }

    return requestData
  }

  private async getContracts(): Promise<TenderlyContract[]> {
    const data = await this.env.run("compile:get-compiler-input")

    const requestContracts: TenderlyContract[] = [];

    Object.keys(data.sources).forEach((key, _) => {
      const name = key.split("/").slice(-1)[0].split(".")[0];
      const contractToPush: TenderlyContract = {
        contractName: name,
        source: data.sources[key].content,
        sourcePath: key,
        networks: {},
        compiler: {
          name: 'solc',
          version: this.env.config.solc?.version!
        }
      };
      requestContracts.push(contractToPush)
    })
    return requestContracts
  }

  private async getContractData(): Promise<TenderlyContractUploadRequest> {

    const config = this.env.config

    const contracts = await this.getContracts()

    const solcConfig = {
      compiler_version: config.solc?.version,
      optimizations_used: config.solc?.optimizer!.enabled,
      optimizations_count: config.solc?.optimizer!.runs,
    }

    return {
      contracts: contracts,
      config: solcConfig
    }
  }
}
