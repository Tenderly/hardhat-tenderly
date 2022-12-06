import { sep } from "path";
import * as fs from "fs-extra";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyService } from "tenderly";
import { TenderlyArtifact, TenderlyContractUploadRequest, TenderlyForkContractUploadRequest } from "tenderly/types";
import { NETWORK_NAME_CHAIN_ID_MAP } from "tenderly/common/constants";
import { logger } from "./utils/logger";

import { ContractByName, Metadata } from "./tenderly/types";
import { CONTRACTS_NOT_DETECTED, NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG } from "./tenderly/errors";
import { extractCompilerVersion, getCompilerDataFromContracts, getContracts, resolveDependencies } from "./utils/util";
import { DEFAULT_CHAIN_ID, PLUGIN_NAME } from "./constants";
import { TenderlyNetwork } from "./TenderlyNetwork";

export class Tenderly {
  public env: HardhatRuntimeEnvironment;
  public tenderlyNetwork: TenderlyNetwork;

  private tenderlyService = new TenderlyService(PLUGIN_NAME);

  constructor(hre: HardhatRuntimeEnvironment) {
    logger.debug("Making hardhat Tenderly interface...");

    this.env = hre;
    this.tenderlyNetwork = new TenderlyNetwork(hre);

    logger.debug("Finished making hardhat Tenderly interface.");
  }

  public async verify(...contracts: any[]): Promise<void> {
    logger.info("Public verification has been called.");

    const priv = this.env.config.tenderly?.privateVerification;
    if (priv !== undefined && priv && this.env.network.name !== "tenderly") {
      logger.info(
        "Private verification flag is set to TRUE in tenderly configuration. Redirecting to private verification..."
      );
      return this.push(...contracts);
    }

    if (this.env.network.name === "tenderly") {
      logger.info("Network parameter is set to 'tenderly', redirecting to fork verification...");
      return this.tenderlyNetwork.verify(contracts);
    }

    const flatContracts: ContractByName[] = contracts.reduce((accumulator, value) => accumulator.concat(value), []);

    const requestData = await this._filterContracts(flatContracts);

    if (requestData === null) {
      logger.error("Verification failed");
      return;
    }

    await this.tenderlyService.verifyContracts(requestData);
  }

  public async verifyAPI(request: TenderlyContractUploadRequest): Promise<void> {
    logger.info("Public verification API has been called.");

    if (this.env.network.name === "tenderly") {
      logger.error(
        `Error in ${PLUGIN_NAME}: Network parameter is set to 'tenderly' and verifyAPI() is not available for fork deployments, please use verifyForkAPI().`
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
    logger.info("Fork verification has been called.");
    if (this.env.network.name !== "tenderly") {
      console.log(
        `Error in ${PLUGIN_NAME}: Network parameter is not set to 'tenderly' and verifyForkAPI() is only available for tenderly fork deployments, please use --network tenderly.`
      );
      return;
    }

    await this.tenderlyNetwork.verifyAPI(request, tenderlyProject, username, forkID);
  }

  public network(): TenderlyNetwork {
    return this.tenderlyNetwork;
  }

  public setNetwork(network: TenderlyNetwork): TenderlyNetwork {
    this.tenderlyNetwork = network;
    logger.trace("Network is set to 'tenderly'.", network);

    return this.tenderlyNetwork;
  }

  public async push(...contracts: any[]): Promise<void> {
    logger.info("Private verification has been called.");

    const priv = this.env.config.tenderly?.privateVerification;
    if (priv !== undefined && !priv) {
      logger.info(
        "Private verification flag is set to FALSE in tenderly configuration. Redirecting to public verification..."
      );
      return this.verify(...contracts);
    }

    const flatContracts: ContractByName[] = contracts.reduce((accumulator, value) => accumulator.concat(value), []);

    const requestData = await this._filterContracts(flatContracts);

    if (this.env.config.tenderly.project === undefined) {
      logger.error(
        `Error in ${PLUGIN_NAME}: Please provide the project field in the tenderly object in hardhat.config.js`
      );
      return;
    }

    if (this.env.config.tenderly.username === undefined) {
      logger.error(
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
    logger.info("Private verification API has been called.");

    if (this.env.network.name === "tenderly") {
      logger.error(
        `Error in ${PLUGIN_NAME}: Network parameter is set to 'tenderly' and pushAPI() is not available for fork deployments, please use verifyForkAPI().`
      );
      return;
    }

    await this.tenderlyService.pushContracts(request, tenderlyProject, username);
  }

  public async persistArtifacts(...contracts: ContractByName[]) {
    logger.info("Artifact persisting has been called.");
    if (contracts.length === 0) {
      logger.error("No contracts were provided during artifact persisting.");
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
      logger.trace("Currently processing file:", sourcePath);

      const name = sourcePath.split("/").slice(-1)[0].split(".")[0];
      logger.trace("Obtained name from source file:", name);

      for (contract of contracts) {
        if (contract.name === name) {
          logger.trace("Found contract:", contract.name);

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

          logger.trace("Processed artifact: ", artifact);

          fs.outputFileSync(`${destPath}${name}.json`, JSON.stringify(artifact));
        }
      }
    });
  }

  private async _filterContracts(flatContracts: ContractByName[]): Promise<TenderlyContractUploadRequest | null> {
    logger.info("Contract filtering has been called.");

    let contract: ContractByName;
    let requestData: TenderlyContractUploadRequest;
    try {
      requestData = await this._getContractData(flatContracts);
      logger.silly("Request data obtained: ", requestData);
    } catch (e) {
      logger.error("Error caught while trying to process contracts by name: ", e);
      return null;
    }

    for (contract of flatContracts) {
      const network =
        this.env.hardhatArguments.network !== "hardhat"
          ? this.env.hardhatArguments.network ?? contract.network
          : contract.network;
      if (network === undefined) {
        logger.error(
          `Error in ${PLUGIN_NAME}: Please provide a network via the hardhat --network argument or directly in the contract`
        );
        return null;
      }
      logger.trace("Found network is:", network);

      const index = requestData.contracts.findIndex(
        (requestContract) => requestContract.contractName === contract.name
      );
      if (index === -1) {
        logger.error(`Contract '${contract.name}' was not found among the contracts in /artifacts.`);
        continue;
      }
      let chainID: string = NETWORK_NAME_CHAIN_ID_MAP[network!.toLowerCase()];
      if (this.env.config.networks[network!].chainId !== undefined) {
        chainID = this.env.config.networks[network!].chainId!.toString();
      }
      logger.trace(`ChainID for network '${network}' is ${chainID}`);

      if (chainID === undefined) {
        logger.error(
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

    logger.debug("Processed request data from _filterContracts:", requestData);

    return requestData;
  }

  private async _getContractData(flatContracts: ContractByName[]): Promise<TenderlyContractUploadRequest> {
    const contracts = await getContracts(this.env, flatContracts);

    const config = getCompilerDataFromContracts(contracts, flatContracts, this.env.config);
    if (config === undefined) {
      logger.error(NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG);
    }

    return {
      contracts,
      config: config!,
    };
  }
}
