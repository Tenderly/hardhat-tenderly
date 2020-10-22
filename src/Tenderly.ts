import * as fs from "fs-extra";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {sep} from "path";

import {NetworkMap, PluginName} from "./index";
import {TenderlyService} from "./tenderly/TenderlyService";
import {
  ContractByName,
  Metadata,
  TenderlyArtifact,
  TenderlyContract,
  TenderlyContractUploadRequest
} from "./tenderly/types";

export class Tenderly {
  public env: HardhatRuntimeEnvironment;

  constructor(bre: HardhatRuntimeEnvironment) {
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
        `Error in ${PluginName}: Please provide the project field in the tenderly object in hardhat.config.js`
      );
      return;
    }

    if (this.env.config.tenderly.username === undefined) {
      console.log(
        `Error in ${PluginName}: Please provide the username field in the tenderly object in hardhat.config.js`
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
    const sourcePaths = await this.env.run("compile:solidity:get-source-paths");
    const sourceNames = await this.env.run(
      "compile:solidity:get-source-names",
      {sourcePaths}
    );
    const data = await this.env.run("compile:solidity:get-dependency-graph", {
      sourceNames
    });

    let contract: ContractByName;
    const destPath = `deployments${sep}localhost_5777${sep}`;

    data._resolvedFiles.forEach((resolvedFile, _) => {
      const sourcePath: string = resolvedFile.sourceName;
      const name = sourcePath
        .split("/")
        .slice(-1)[0]
        .split(".")[0];

      for (contract of contracts) {
        if (contract.name === name) {
          const contractDataPath = `${this.env.config.paths.artifacts}${sep}${sourcePath}${sep}${name}.json`;
          const contractData = JSON.parse(
            fs.readFileSync(contractDataPath).toString()
          );

          const metadata: Metadata = {
            compiler: {
              version: this.env.config.solidity.compilers[0].version
            },
            sources: {
              [sourcePath]: {
                content: resolvedFile.content.rawContent
              }
            }
          };

          data._dependenciesPerFile
            .get(sourcePath)
            .forEach((resolvedDependency, __) => {
              metadata.sources[resolvedDependency.sourceName] = {
                content: resolvedDependency.content.rawContent
              };
            });

          const artifact: TenderlyArtifact = {
            metadata: JSON.stringify(metadata),
            address: contract.address,
            bytecode: contractData.bytecode,
            deployedBytecode: contractData.deployedBytecode,
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
        this.env.hardhatArguments.network !== "hardhat"
          ? this.env.hardhatArguments.network
          : contract.network;
      if (network === undefined) {
        console.log(
          `Error in ${PluginName}: Please provide a network via the hardhat --network argument or directly in the contract`
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
    const sourcePaths = await this.env.run("compile:solidity:get-source-paths");
    const sourceNames = await this.env.run(
      "compile:solidity:get-source-names",
      {sourcePaths}
    );
    const data = await this.env.run("compile:solidity:get-dependency-graph", {
      sourceNames
    });

    const requestContracts: TenderlyContract[] = [];

    data._resolvedFiles.forEach((resolvedFile, _) => {
      const name = resolvedFile.sourceName
        .split("/")
        .slice(-1)[0]
        .split(".")[0];
      const contractToPush: TenderlyContract = {
        contractName: name,
        source: resolvedFile.content.rawContent,
        sourcePath: resolvedFile.sourceName,
        networks: {},
        compiler: {
          name: "solc",
          version: this.env.config.solidity?.compilers[0].version!
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
      compiler_version: config.solidity.compilers[0].version,
      optimizations_used: config.solidity.compilers[0].settings.optimizer.enabled,
      optimizations_count: config.solidity.compilers[0].settings.optimizer.runs
    };

    return {
      contracts,
      config: solcConfig
    };
  }
}
