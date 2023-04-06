import { sep } from "path";
import * as fs from "fs-extra";
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyService } from "tenderly";
import {
  TenderlyArtifact,
  TenderlyContractUploadRequest,
  TenderlyForkContractUploadRequest,
  TenderlyVerifyContractsRequest,
} from "tenderly/types";
import { NETWORK_NAME_CHAIN_ID_MAP } from "tenderly/common/constants";
import { logger } from "./utils/logger";

import { ContractByName, Metadata } from "./tenderly/types";
import { CONTRACTS_NOT_DETECTED, NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG } from "./tenderly/errors";
import {
  extractCompilerVersion,
  getCompilerDataFromContracts,
  getContracts,
  makeVerifyContractsRequest,
  resolveDependencies,
} from "./utils/util";
import { DEFAULT_CHAIN_ID, PLUGIN_NAME, VERIFICATION_TYPES } from "./constants";
import { TenderlyNetwork } from "./TenderlyNetwork";

export class Tenderly {
  public env: HardhatRuntimeEnvironment;
  public tenderlyNetwork: TenderlyNetwork;

  private tenderlyService = new TenderlyService(PLUGIN_NAME);

  constructor(hre: HardhatRuntimeEnvironment) {
    logger.debug("Creating Tenderly plugin.");

    this.env = hre;
    this.tenderlyNetwork = new TenderlyNetwork(hre);

    logger.debug("Created Tenderly plugin.");
  }

  public async verify(...contracts: any[]): Promise<void> {
    logger.info("Verification invoked.");

    const flatContracts: ContractByName[] = contracts.reduce((accumulator, value) => accumulator.concat(value), []);
    const verificationType = this._getVerificationType();
    const platformID = verificationType === VERIFICATION_TYPES.FORK ? this.tenderlyNetwork.forkID : this.tenderlyNetwork.devnetID

    const requestData = await makeVerifyContractsRequest(
      this.env,
      flatContracts,
      platformID,
    );
    if (requestData === null) {
      logger.error("Verification failed due to bad processing of the data in /artifacts directory.");
      return;
    }
    if (this.isVerificationOnPlatform(verificationType)) {
      logger.info(`Network parameter is set to 'tenderly', redirecting to ${verificationType} verification.`);
      await this._throwIfUsernameOrProjectNotSet();

      return this.tenderlyNetwork.verify(requestData);
    }

    if (verificationType === VERIFICATION_TYPES.PRIVATE) {
      logger.info("Private verification flag is set to true, redirecting to private verification.");
      await this._throwIfUsernameOrProjectNotSet();

      return this.tenderlyService.pushContractsMultiCompiler(
        requestData,
        this.env.config.tenderly.project,
        this.env.config.tenderly.username
      );
    }

    logger.info("Publicly verifying contracts.");
    return this.tenderlyService.verifyContractsMultiCompiler(requestData);
  }

  public async verifyMultiCompilerAPI(request: TenderlyVerifyContractsRequest): Promise<void> {
    logger.info("Invoked verification (multi compiler version) through API.");
    logger.trace("Request data:", request);

    switch (this._getVerificationType()) {
      case VERIFICATION_TYPES.FORK:
        logger.error(
          `Error in ${PLUGIN_NAME}: Network parameter is set to 'tenderly' and verifyMultiCompilerAPI() is not available for fork deployments, please use verifyForkAPI().`
        );
        break;
      case VERIFICATION_TYPES.DEVNET:
        logger.error(
          `Error in ${PLUGIN_NAME}: Network parameter is set to 'tenderly' and verifyMultiCompilerAPI() is not available for devnet deployments`
        );
        break;
      case VERIFICATION_TYPES.PRIVATE:
        if (this.env.config.tenderly?.project === undefined) {
          logger.error(
            `Error in ${PLUGIN_NAME}: Please provide the project field in the tenderly object in hardhat.config.js`
          );
          return;
        }
        if (this.env.config.tenderly?.username === undefined) {
          logger.error(
            `Error in ${PLUGIN_NAME}: Please provide the username field in the tenderly object in hardhat.config.js`
          );
          return;
        }

        logger.info("Private verification flag is set to true, redirecting to private verification.");
        await this.tenderlyService.pushContractsMultiCompiler(
          request,
          this.env.config.tenderly.project,
          this.env.config.tenderly.username
        );
        break;
      case VERIFICATION_TYPES.PUBLIC:
        logger.info("Publicly verifying contracts.");
        await this.tenderlyService.verifyContractsMultiCompiler(request);
        break;
    }
  }

  public async verifyForkMultiCompilerAPI(
    request: TenderlyVerifyContractsRequest,
    tenderlyProject: string,
    username: string,
    forkID: string
  ): Promise<void> {
    logger.info("Invoked fork verification through API request. (Multi compiler version)");
    if (this.env.network.name !== "tenderly") {
      logger.error(
        `Error in ${PLUGIN_NAME}: Network parameter is not set to 'tenderly' and verifyForkAPI() is only available for tenderly fork deployments, please use --network tenderly.`
      );
      return;
    }
    await this._throwIfUsernameOrProjectNotSet();

    await this.tenderlyNetwork.verifyMultiCompilerAPI(request, tenderlyProject, username, forkID);
  }

  public network(): TenderlyNetwork {
    return this.tenderlyNetwork;
  }

  public setNetwork(network: TenderlyNetwork): TenderlyNetwork {
    this.tenderlyNetwork = network;
    logger.trace("Network is set to 'tenderly'.", network);

    return this.tenderlyNetwork;
  }

  private _getVerificationType(): string {
    if (this.env.network.name === "tenderly") 
    {
      return this.tenderlyNetwork.devnetID !== undefined ? VERIFICATION_TYPES.DEVNET : VERIFICATION_TYPES.FORK
    }

    const priv = this.env.config.tenderly?.privateVerification;
    if (priv !== undefined && priv && this.env.network.name !== "tenderly") {
      return VERIFICATION_TYPES.PRIVATE;
    }

    return VERIFICATION_TYPES.PUBLIC;
  }

  public async push(...contracts: any[]): Promise<void> {
    return this.verify(...contracts);
  }

  private async _throwIfUsernameOrProjectNotSet(): Promise<void> {
    if (this.env.config.tenderly?.project === undefined) {
      throw Error(
        `Error in ${PLUGIN_NAME}: Please provide the project field in the tenderly object in hardhat.config.js`
      );
    }
    if (this.env.config.tenderly?.username === undefined) {
      throw Error(
        `Error in ${PLUGIN_NAME}: Please provide the username field in the tenderly object in hardhat.config.js`
      );
    }
  }

  public async verifyAPI(request: TenderlyContractUploadRequest): Promise<void> {
    logger.info("Invoked public verification through API request.");

    if (this.env.network.name === "tenderly") {
      if (this._getVerificationType() === VERIFICATION_TYPES.DEVNET){
        logger.error(
          `Error in ${PLUGIN_NAME}: Network parameter is set to 'tenderly' and verifyAPI() is not available for devnet deployments.`
        );
        return
      }
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
    logger.info("Invoked fork verification through API request.");
    if (this.env.network.name !== "tenderly") {
      logger.error(
        `Error in ${PLUGIN_NAME}: Network parameter is not set to 'tenderly' and verifyForkAPI() is only available for tenderly fork deployments, please use --network tenderly.`
      );
      return;
    }

    await this.tenderlyNetwork.verifyAPI(request, tenderlyProject, username, forkID);
  }

  public async pushAPI(
    request: TenderlyContractUploadRequest,
    tenderlyProject: string,
    username: string
  ): Promise<void> {
    logger.info("Invoked pushing contracts through API.");

    if (this.env.network.name === "tenderly") {
      if (this._getVerificationType() === VERIFICATION_TYPES.DEVNET){
        logger.error(
          `Error in ${PLUGIN_NAME}: Network parameter is set to 'tenderly' and pushAPI() is not available for devnet deployments.`
        );
        return
      }
      logger.error(
        `Error in ${PLUGIN_NAME}: Network parameter is set to 'tenderly' and pushAPI() is not available for fork deployments, please use verifyForkAPI().`
      );
      return;
    }

    await this.tenderlyService.pushContracts(request, tenderlyProject, username);
  }

  public async persistArtifacts(...contracts: ContractByName[]) {
    logger.info("Invoked persisting artifacts.");
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
    logger.info("Processing data needed for verification.");

    let contract: ContractByName;
    let requestData: TenderlyContractUploadRequest;
    try {
      requestData = await this._getContractData(flatContracts);
      logger.silly("Processed request data:", requestData);
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
          `Error in ${PLUGIN_NAME}: Couldn't identify network. Please provide a chainId in the network config object`
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
  private isVerificationOnPlatform(verificationType: string): boolean {
    return verificationType === VERIFICATION_TYPES.DEVNET || verificationType === VERIFICATION_TYPES.FORK
  }
}
