import {BuidlerRuntimeEnvironment} from "@nomiclabs/buidler/types";
import * as fs from "fs-extra";
import {sep} from "path";

import {NetworkMap, PluginName} from "./index";
import {TenderlyService} from "./tenderly/TenderlyService";
import {
  ContractByName,
  TenderlyArtifact,
  TenderlyContract,
  TenderlyContractUploadRequest
} from "./tenderly/types";

export class Tenderly {
  public env: BuidlerRuntimeEnvironment;

  constructor(bre: BuidlerRuntimeEnvironment) {
    this.env = bre;
  }

  public async verify(...contracts) {
    const flatContracts: ContractByName[] = contracts.reduce(
      (accumulator, value) => accumulator.concat(value),
      []
    );

    const requestData = await this.filterContracts(flatContracts);

    if (requestData == null) {
      console.log("Verification failed");
      return;
    }

    try {
      await TenderlyService.verifyContracts(requestData);
    } catch (err) {
      console.log(err.message);
    }
  }

  public async push(...contracts) {
    const flatContracts: ContractByName[] = contracts.reduce(
      (accumulator, value) => accumulator.concat(value),
      []
    );

    const requestData = await this.filterContracts(flatContracts);

    if (this.env.config.tenderly.project === undefined) {
      console.log(
        `Error in ${PluginName}: Please provide the project field in the tenderly object in buidler.config.js`
      );
      return;
    }

    if (this.env.config.tenderly.username === undefined) {
      console.log(
        `Error in ${PluginName}: Please provide the username field in the tenderly object in buidler.config.js`
      );
      return;
    }

    if (requestData == null) {
      console.log("Push failed");
      return;
    }

    try {
      await TenderlyService.pushContracts(
        requestData,
        this.env.config.tenderly.project,
        this.env.config.tenderly.username
      );
    } catch (err) {
      console.log(err.message);
    }
  }

  public async persistArtifacts(...contracts) {
    const data = await this.env.run("compile:get-compiler-input");
    const outputPath = `${this.env.config.paths.cache}${sep}solc-output.json`;
    const outputData = JSON.parse(fs.readFileSync(outputPath).toString());
    let contract: ContractByName;
    const destPath = `deployments${sep}localhost_5777${sep}`;

    Object.keys(data.sources).forEach((key, _) => {
      const name = key
        .split("/")
        .slice(-1)[0]
        .split(".")[0];

      for (contract of contracts) {
        if (contract.name === name) {
          const contractData = outputData.contracts[key][name];
          const artifact: TenderlyArtifact = {
            metadata: contractData.metadata,
            address: contract.address,
            bytecode: contractData.evm.bytecode.object,
            deployedBytecode: contractData.evm.deployedBytecode.object,
            abi: contractData.abi
          };

          fs.outputFileSync(
            `${destPath}${name}.json`,
            JSON.stringify(artifact)
          );
        }
      }
    });
  }

  private async filterContracts(
    flatContracts: ContractByName[]
  ): Promise<TenderlyContractUploadRequest | null> {
    let contract: ContractByName;
    const requestData = await this.getContractData();

    for (contract of flatContracts) {
      const network =
        this.env.buidlerArguments.network !== "buidlerevm"
          ? this.env.buidlerArguments.network
          : contract.network;
      if (network === undefined) {
        console.log(
          `Error in ${PluginName}: Please provide a network via the buidler --network argument or directly in the contract`
        );
        return null;
      }

      const index = requestData.contracts.findIndex(
        requestContract => requestContract.contractName === contract.name
      );
      if (index === -1) {
        continue;
      }
      requestData.contracts[index].networks = {
        [NetworkMap[network]]: {
          address: contract.address
        }
      };
    }

    return requestData;
  }

  private async getContracts(): Promise<TenderlyContract[]> {
    const data = await this.env.run("compile:get-compiler-input");

    const requestContracts: TenderlyContract[] = [];

    Object.keys(data.sources).forEach((key, _) => {
      const name = key
        .split("/")
        .slice(-1)[0]
        .split(".")[0];
      const contractToPush: TenderlyContract = {
        contractName: name,
        source: data.sources[key].content,
        sourcePath: key,
        networks: {},
        compiler: {
          name: "solc",
          version: this.env.config.solc?.version!
        }
      };
      requestContracts.push(contractToPush);
    });
    return requestContracts;
  }

  private async getContractData(): Promise<TenderlyContractUploadRequest> {
    const config = this.env.config;

    const contracts = await this.getContracts();

    const solcConfig = {
      compiler_version: config.solc?.version,
      optimizations_used: config.solc?.optimizer!.enabled,
      optimizations_count: config.solc?.optimizer!.runs
    };

    return {
      contracts,
      config: solcConfig
    };
  }
}
