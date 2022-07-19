import * as fs from "fs-extra";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { sep } from "path";

import { DefaultChainId, NetworkMap, PluginName } from "./constants";
import {
  CONTRACTS_NOT_DETECTED,
  NO_COMPILER_FOUND_FOR_CONTRACT
} from "./tenderly/errors";
import { TenderlyService } from "./tenderly/TenderlyService";
import {
  ContractByName,
  Metadata,
  TenderlyArtifact,
  TenderlyContractUploadRequest,
  TenderlyForkContractUploadRequest
} from "./tenderly/types";
import { TenderlyNetwork } from "./TenderlyNetwork";
import { logError } from "./utils/error_logger";
import {
  extractCompilerVersion,
  getCompilerDataFromContracts,
  getContracts,
  resolveDependencies
} from "./utils/util";

export class Tenderly {
  public env: HardhatRuntimeEnvironment;
  public tenderlyNetwork: TenderlyNetwork;

  constructor(hre: HardhatRuntimeEnvironment) {
    this.env = hre;
    this.tenderlyNetwork = new TenderlyNetwork(hre);
  }

  public async verify(...contracts) {
    const priv = this.env.config.tenderly?.privateVerification;
    if (priv !== undefined && priv && this.env.network.name !== "tenderly") {
      return this.push(...contracts);
    }

    if (this.env.network.name === "tenderly") {
      return this.tenderlyNetwork.verify(contracts);
    }

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
      logError(err);
    }
  }

  public async verifyAPI(request: TenderlyContractUploadRequest) {
    if (this.env.network.name === "tenderly") {
      console.log(
        `Error in ${PluginName}: .verifyAPI() is not available for fork deployments, please use verifyForkAPI().`
      );
      return;
    }

    try {
      await TenderlyService.verifyContracts(request);
    } catch (err) {
      logError(err);
    }
  }

  public async verifyForkAPI(
    request: TenderlyForkContractUploadRequest,
    tenderlyProject: string,
    username: string,
    forkID: string
  ) {
    if (this.env.network.name !== "tenderly") {
      console.log(
        `Error in ${PluginName}: .verifyForkAPI() is only available for tenderly fork deployments, please use --network tenderly.`
      );
      return;
    }

    try {
      await this.tenderlyNetwork.verifyAPI(
        request,
        tenderlyProject,
        username,
        forkID
      );
    } catch (err) {
      logError(err);
    }
  }

  public network(): TenderlyNetwork {
    return this.tenderlyNetwork;
  }

  public setNetwork(network: TenderlyNetwork): TenderlyNetwork {
    this.tenderlyNetwork = network;
    return this.tenderlyNetwork;
  }

  public async push(...contracts) {
    const priv = this.env.config.tenderly?.privateVerification;
    if (priv !== undefined && !priv) {
      return this.verify(...contracts);
    }

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
      logError(err);
    }
  }

  public async pushAPI(
    request: TenderlyContractUploadRequest,
    tenderlyProject: string,
    username: string
  ) {
    if (this.env.network.name === "tenderly") {
      console.log(
        `Error in ${PluginName}: .pushAPI() is not available for fork deployments, please use verifyForkAPI().`
      );
      return;
    }

    try {
      await TenderlyService.pushContracts(request, tenderlyProject, username);
    } catch (err) {
      logError(err);
    }
  }

  public async persistArtifacts(...contracts) {
    if (contracts.length === 0) {
      return;
    }

    const sourcePaths = await this.env.run("compile:solidity:get-source-paths");
    const sourceNames = await this.env.run(
      "compile:solidity:get-source-names",
      { sourcePaths }
    );
    const data = await this.env.run("compile:solidity:get-dependency-graph", {
      sourceNames
    });
    if (data.length === 0) {
      throw new HardhatPluginError(PluginName, CONTRACTS_NOT_DETECTED);
    }

    let contract: ContractByName;

    data._resolvedFiles.forEach((resolvedFile, _) => {
      const sourcePath: string = resolvedFile.sourceName;
      const name = sourcePath
        .split("/")
        .slice(-1)[0]
        .split(".")[0];

      for (contract of contracts) {
        if (contract.name === name) {
          const network =
            this.env.hardhatArguments.network !== "hardhat"
              ? this.env.hardhatArguments.network || contract.network
              : contract.network;
          if (network === undefined) {
            console.log(
              `Error in ${PluginName}: Please provide a network via the hardhat --network argument or directly in the contract`
            );
            continue;
          }
          let chainID: string = NetworkMap[network!.toLowerCase()];
          if (this.env.config.networks[network!].chainId !== undefined) {
            chainID = this.env.config.networks[network!].chainId!.toString();
          }

          if (chainID === undefined) {
            chainID = DefaultChainId;
          }
          const deploymentsFolder =
            this.env.config?.tenderly?.deploymentsDir || "deployments";
          const destPath = `${deploymentsFolder}${sep}${network!.toLowerCase()}_${chainID}${sep}`;
          const contractDataPath = `${this.env.config.paths.artifacts}${sep}${sourcePath}${sep}${name}.json`;
          const contractData = JSON.parse(
            fs.readFileSync(contractDataPath).toString()
          );

          const metadata: Metadata = {
            compiler: {
              version: extractCompilerVersion(this.env.config, sourcePath)
            },
            sources: {
              [sourcePath]: {
                content: resolvedFile.content.rawContent
              }
            }
          };

          const visited: Record<string, boolean> = {};

          resolveDependencies(data, sourcePath, metadata, visited);

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
    let requestData: TenderlyContractUploadRequest;
    try {
      requestData = await this.getContractData(flatContracts);
    } catch (e) {
      return null;
    }

    for (contract of flatContracts) {
      const network =
        this.env.hardhatArguments.network !== "hardhat"
          ? this.env.hardhatArguments.network || contract.network
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
      let chainID: string = NetworkMap[network!.toLowerCase()];
      if (this.env.config.networks[network!].chainId !== undefined) {
        chainID = this.env.config.networks[network!].chainId!.toString();
      }

      if (chainID === undefined) {
        console.log(
          `Error in ${PluginName}: Couldn't identify network. Please provide a chainID in the network config object`
        );
        return null;
      }
      console.log(contract.libraries);
      requestData.contracts[index].networks = {
        [chainID]: {
          address: contract.address,
          links: contract.libraries
        }
      };
    }

    return requestData;
  }

  private async getContractData(
    flatContracts: ContractByName[]
  ): Promise<TenderlyContractUploadRequest> {
    const contracts = await getContracts(this.env, flatContracts);

    const config = getCompilerDataFromContracts(
      contracts,
      flatContracts,
      this.env.config
    );

    if (config === undefined) {
      console.log(NO_COMPILER_FOUND_FOR_CONTRACT);
      console.log(flatContracts);
    }

    return {
      contracts,
      config: config!
    };
  }
}
