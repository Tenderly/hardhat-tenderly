import { sep } from "path";
import * as fs from "fs-extra";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyService, VirtualNetworkService } from "tenderly";
import { TenderlyArtifact, TenderlyContractUploadRequest, TenderlyForkContractUploadRequest } from "tenderly/types";
import { NETWORK_NAME_CHAIN_ID_MAP } from "tenderly/common/constants";

import { ContractByName, Metadata } from "./tenderly/types";
import { CONTRACTS_NOT_DETECTED, NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG } from "./tenderly/errors";
import { extractCompilerVersion, getCompilerDataFromContracts, getContracts, resolveDependencies } from "./utils/util";
import { DEFAULT_CHAIN_ID, PLUGIN_NAME } from "./constants";
import { TenderlyNetwork } from "./TenderlyNetwork";

export class Tenderly {
  public env: HardhatRuntimeEnvironment;
  public tenderlyNetwork: TenderlyNetwork;

  private tenderlyService = new TenderlyService(PLUGIN_NAME);
  private virtualNetworkService = new VirtualNetworkService(PLUGIN_NAME);

  constructor(hre: HardhatRuntimeEnvironment) {
    this.env = hre;
    this.tenderlyNetwork = new TenderlyNetwork(hre);
  }

  public async verify(...contracts: any[]): Promise<void> {
    const priv = this.env.config.tenderly?.privateVerification;
    if (priv !== undefined && priv && this.env.network.name !== "tenderly") {
      return this.push(...contracts);
    }

    if (this.env.network.name === "tenderly") {
      return this.tenderlyNetwork.verify(contracts);
    }

    const flatContracts: ContractByName[] = contracts.reduce((accumulator, value) => accumulator.concat(value), []);

    const requestData = await this._filterContracts(flatContracts);

    if (requestData === null) {
      console.log("Verification failed");
      return;
    }

    await this.tenderlyService.verifyContracts(requestData);
  }

  public async verifyAPI(request: TenderlyContractUploadRequest): Promise<void> {
    if (this.env.network.name === "tenderly") {
      console.log(
        `Error in ${PLUGIN_NAME}: .verifyAPI() is not available for fork deployments, please use verifyForkAPI().`
      );
      return;
    }

    await this.tenderlyService.verifyContracts(request);
  }

  public async verifyForkAPI(
    request: TenderlyForkContractUploadRequest,
    tenderlyProject: string,
    username: string,
    forkID: string
  ): Promise<void> {
    if (this.env.network.name !== "tenderly") {
      console.log(
        `Error in ${PLUGIN_NAME}: .verifyForkAPI() is only available for tenderly fork deployments, please use --network tenderly.`
      );
      return;
    }

    // Try to override forkID with VNet fork ID
    const vnet = await this.virtualNetworkService.getVirtualNetwork();
    if (vnet?.vnet_id !== undefined && vnet?.vnet_id !== null) {
      forkID = vnet.vnet_id;
    }

    await this.tenderlyNetwork.verifyAPI(request, tenderlyProject, username, forkID);
  }

  public network(): TenderlyNetwork {
    return this.tenderlyNetwork;
  }

  public setNetwork(network: TenderlyNetwork): TenderlyNetwork {
    this.tenderlyNetwork = network;
    return this.tenderlyNetwork;
  }

  public async push(...contracts: any[]): Promise<void> {
    const priv = this.env.config.tenderly?.privateVerification;
    if (priv !== undefined && !priv) {
      return this.verify(...contracts);
    }

    const flatContracts: ContractByName[] = contracts.reduce((accumulator, value) => accumulator.concat(value), []);

    const requestData = await this._filterContracts(flatContracts);

    if (this.env.config.tenderly.project === undefined) {
      console.log(
        `Error in ${PLUGIN_NAME}: Please provide the project field in the tenderly object in hardhat.config.js`
      );
      return;
    }

    if (this.env.config.tenderly.username === undefined) {
      console.log(
        `Error in ${PLUGIN_NAME}: Please provide the username field in the tenderly object in hardhat.config.js`
      );
      return;
    }

    if (requestData === null) {
      console.log("Push failed");
      return;
    }

    await this.tenderlyService.pushContracts(
      requestData,
      this.env.config.tenderly.project,
      this.env.config.tenderly.username
    );
  }

  public async pushAPI(
    request: TenderlyContractUploadRequest,
    tenderlyProject: string,
    username: string
  ): Promise<void> {
    if (this.env.network.name === "tenderly") {
      console.log(
        `Error in ${PLUGIN_NAME}: .pushAPI() is not available for fork deployments, please use verifyForkAPI().`
      );
      return;
    }

    await this.tenderlyService.pushContracts(request, tenderlyProject, username);
  }

  public async persistArtifacts(...contracts: ContractByName[]) {
    if (contracts.length === 0) {
      return;
    }

    const sourcePaths = await this.env.run("compile:solidity:get-source-paths");
    const sourceNames = await this.env.run("compile:solidity:get-source-names", { sourcePaths });
    const data = await this.env.run("compile:solidity:get-dependency-graph", {
      sourceNames,
    });
    if (data.length === 0) {
      throw new HardhatPluginError(PLUGIN_NAME, CONTRACTS_NOT_DETECTED);
    }

    let contract: ContractByName;

    data._resolvedFiles.forEach((resolvedFile: any, _: any) => {
      const sourcePath: string = resolvedFile.sourceName;
      const name = sourcePath.split("/").slice(-1)[0].split(".")[0];

      for (contract of contracts) {
        if (contract.name === name) {
          const network =
            this.env.hardhatArguments.network !== "hardhat"
              ? this.env.hardhatArguments.network ?? contract.network
              : contract.network;
          if (network === undefined) {
            console.log(
              `Error in ${PLUGIN_NAME}: Please provide a network via the hardhat --network argument or directly in the contract`
            );
            continue;
          }
          let chainID: string = NETWORK_NAME_CHAIN_ID_MAP[network!.toLowerCase()];
          if (this.env.config.networks[network!].chainId !== undefined) {
            chainID = this.env.config.networks[network!].chainId!.toString();
          }

          if (chainID === undefined) {
            chainID = DEFAULT_CHAIN_ID;
          }
          const deploymentsFolder = this.env.config?.tenderly?.deploymentsDir ?? "deployments";
          const destPath = `${deploymentsFolder}${sep}${network!.toLowerCase()}_${chainID}${sep}`;
          const contractDataPath = `${this.env.config.paths.artifacts}${sep}${sourcePath}${sep}${name}.json`;
          const contractData = JSON.parse(fs.readFileSync(contractDataPath).toString());

          const metadata: Metadata = {
            defaultCompiler: {
              version: extractCompilerVersion(this.env.config, sourcePath),
            },
            sources: {
              [sourcePath]: {
                content: resolvedFile.content.rawContent,
                versionPragma: resolvedFile.content.versionPragmas[0],
              },
            },
          };

          const visited: Record<string, boolean> = {};

          resolveDependencies(data, sourcePath, metadata, visited);

          const artifact: TenderlyArtifact = {
            metadata: JSON.stringify(metadata),
            address: contract.address,
            bytecode: contractData.bytecode,
            deployedBytecode: contractData.deployedBytecode,
            abi: contractData.abi,
          };

          fs.outputFileSync(`${destPath}${name}.json`, JSON.stringify(artifact));
        }
      }
    });
  }

  private async _filterContracts(flatContracts: ContractByName[]): Promise<TenderlyContractUploadRequest | null> {
    let contract: ContractByName;
    let requestData: TenderlyContractUploadRequest;
    try {
      requestData = await this._getContractData(flatContracts);
    } catch (e) {
      return null;
    }

    for (contract of flatContracts) {
      const network =
        this.env.hardhatArguments.network !== "hardhat"
          ? this.env.hardhatArguments.network ?? contract.network
          : contract.network;
      if (network === undefined) {
        console.log(
          `Error in ${PLUGIN_NAME}: Please provide a network via the hardhat --network argument or directly in the contract`
        );
        return null;
      }

      const index = requestData.contracts.findIndex(
        (requestContract) => requestContract.contractName === contract.name
      );
      if (index === -1) {
        continue;
      }
      let chainID: string = NETWORK_NAME_CHAIN_ID_MAP[network!.toLowerCase()];
      if (this.env.config.networks[network!].chainId !== undefined) {
        chainID = this.env.config.networks[network!].chainId!.toString();
      }

      if (chainID === undefined) {
        console.log(
          `Error in ${PLUGIN_NAME}: Couldn't identify network. Please provide a chainID in the network config object`
        );
        return null;
      }
      requestData.contracts[index].networks = {
        [chainID]: {
          address: contract.address,
          links: contract.libraries,
        },
      };
    }

    return requestData;
  }

  private async _getContractData(flatContracts: ContractByName[]): Promise<TenderlyContractUploadRequest> {
    const contracts = await getContracts(this.env, flatContracts);

    const config = getCompilerDataFromContracts(contracts, flatContracts, this.env.config);
    if (config === undefined) {
      console.log(NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG);
    }

    return {
      contracts,
      config: config!,
    };
  }
}
