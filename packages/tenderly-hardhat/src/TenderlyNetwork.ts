import * as axios from "axios";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyService } from "tenderly";
import {
  TenderlyForkContractUploadRequest,
  TenderlyVerifyContractsRequest,
} from "tenderly/types";
import { getConfig, writeConfig } from "tenderly/utils/config";
import { TENDERLY_JSON_RPC_BASE_URL } from "tenderly/common/constants";

import { convertToLogCompliantForkInitializeResponse } from "tenderly/utils/log-compliance";
import { PLUGIN_NAME } from "./constants";
import { ContractByName } from "./tenderly/types";
import { NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG } from "./tenderly/errors";
import {
  getCompilerDataFromContracts,
  getContracts,
  isTenderlyNetworkConfig,
} from "./utils/util";
import { logger } from "./utils/logger";

export class TenderlyNetwork {
  public host: string;
  public connected: boolean;
  public accessKey: string;
  public head: string | undefined;
  public vnetID: string | undefined;
  public tenderlyJsonRpc: axios.AxiosInstance;
  public accounts: Record<string, string> | undefined;
  public env: HardhatRuntimeEnvironment;
  public devnetID: string | undefined;

  private tenderlyService = new TenderlyService(PLUGIN_NAME);

  constructor(hre: HardhatRuntimeEnvironment) {
    logger.debug("Making an interface towards tenderly network.");

    this.env = hre;
    this.connected = true;

    const tdlyGlobalConfig = getConfig();

    this.accessKey = tdlyGlobalConfig?.access_key;

    this.tenderlyJsonRpc = this._configureTenderlyRPCInstance();
    this.host = this.tenderlyJsonRpc.defaults.baseURL!;

    if (
      isTenderlyNetworkConfig(hre.network.config) &&
      "url" in hre.network.config &&
      hre.network.config.url !== undefined
    ) {
      if (hre.network.config.url.includes("devnet")) {
        this.devnetID = hre.network.config.url.split("/").pop();
        logger.info("Devnet ID is:", this.devnetID);
      } else {
        this.vnetID = hre.network.config.url.split("/").pop();
        logger.info("VNET ID is:", this.vnetID);
      }
    }
  }

  public supportsSubscriptions() {
    if (!this._checkNetwork()) {
      return;
    }
    return false;
  }

  public disconnect() {
    if (!this._checkNetwork()) {
      return;
    }
    return true;
  }

  public async send(payload: any, cb: any) {
    if (!this._checkNetwork()) {
      return;
    }
    if (this.head === undefined) {
      await this.initializeFork();
    }
    try {
      if (this.head !== undefined) {
        this.tenderlyJsonRpc.defaults.headers.common.Head = this.head;
      }
      const resp = await this.tenderlyJsonRpc.post("", payload);
      this.head = resp.headers.head;

      this._writeHead();
      cb(null, resp.data);
    } catch (err: any) {
      cb(err.response.data);
    }
  }

  public resetFork(): string | undefined {
    const tdlyGlobalConfig = getConfig();
    const oldHead = tdlyGlobalConfig.head;

    delete tdlyGlobalConfig.head;
    delete tdlyGlobalConfig.fork;

    writeConfig(tdlyGlobalConfig);
    return oldHead;
  }

  public async verify(requestData: TenderlyVerifyContractsRequest) {
    logger.info("Invoked verification.");
    if (!this._checkNetwork()) {
      return;
    }

    if (this.devnetID !== undefined) {
      await this.tenderlyService.verifyDevnetContractsMultiCompiler(
        requestData,
        this.env.config.tenderly.project,
        this.env.config.tenderly.username,
        this.devnetID,
        this.env.config.tenderly.accessKey,
      );
      return;
    }

    if (this.head === undefined && this.vnetID === undefined) {
      logger.warn("Head or fork are not initialized.");
      await this.initializeFork();
    }

    await this.tenderlyService.verifyVnetContractsMultiCompiler(
      requestData,
      this.env.config.tenderly.project,
      this.env.config.tenderly.username,
      this.vnetID!,
    );
  }

  public async verifyMultiCompilerAPI(
    request: TenderlyVerifyContractsRequest,
    tenderlyProject: string,
    username: string,
    forkID: string,
  ) {
    logger.info("Invoked fork verification via API.");
    await this.tenderlyService.verifyVnetContractsMultiCompiler(
      request,
      tenderlyProject,
      username,
      forkID,
    );
  }

  public async verifyDevnetMultiCompilerAPI(
    request: TenderlyVerifyContractsRequest,
    tenderlyProject: string,
    username: string,
    devnetID: string,
  ) {
    logger.info("Invoked devnet verification via API.");
    await this.tenderlyService.verifyDevnetContractsMultiCompiler(
      request,
      tenderlyProject,
      username,
      devnetID,
    );
  }

  public async verifyAPI(
    request: TenderlyForkContractUploadRequest,
    tenderlyProject: string,
    username: string,
    forkID: string,
  ) {
    logger.info("Invoked fork verification via API.");
    await this.tenderlyService.verifyForkContracts(
      request,
      tenderlyProject,
      username,
      forkID,
    );
  }

  public getHead(): string | undefined {
    if (!this._checkNetwork()) {
      return;
    }
    return this.head;
  }

  public setHead(head: string | undefined): void {
    if (!this._checkNetwork()) {
      return;
    }
    this.head = head;
  }

  public async getVnetID(): Promise<string | undefined> {
    if (!this._checkNetwork()) {
      return;
    }

    return this.vnetID;
  }

  public setVnetID(vnet: string | undefined): void {
    if (!this._checkNetwork()) {
      return;
    }
    this.vnetID = fork;
  }

  public async initializeFork() {
    logger.debug("Initializing tenderly fork.");

    if (!this._checkNetwork()) {
      return;
    }
    if (this.env.config.tenderly?.forkNetwork === undefined) {
      logger.error(
        "There is no information about the fork network. Fork won't be initialized",
      );
      return;
    }

    const username: string = this.env.config.tenderly.username;
    const projectID: string = this.env.config.tenderly.project;
    logger.trace("ProjectID obtained from tenderly configuration:", {
      projectID,
    });

    try {
      const resp = await this.tenderlyJsonRpc.post(
        `/account/${username}/project/${projectID}/fork`,
        {
          network_id: this.env.config.tenderly.forkNetwork,
        },
      );
      const logCompliantInitializeForkResponse =
        convertToLogCompliantForkInitializeResponse(resp);
      logger.trace("Initialized fork:", logCompliantInitializeForkResponse);

      this.head = resp.data.root_transaction.id;
      this.accounts = resp.data.simulation_fork.accounts;
      this.vnetID = resp.data.simulation_fork.id;

      logger.debug("Successfully initialized tenderly fork.");
    } catch (err) {
      logger.error("Error was caught while calling fork initialization:", err);
      throw err;
    }
  }
  public setDevnetID(devnetID: string | undefined) {
    if (!this._checkNetwork()) {
      return;
    }
    this.devnetID = devnetID;
  }

  private _writeHead() {
    const tdlyGlobalConfig = getConfig();
    tdlyGlobalConfig.head = this.head;
    writeConfig(tdlyGlobalConfig);
  }

  private async _filterContracts(
    flatContracts: ContractByName[],
  ): Promise<TenderlyForkContractUploadRequest | null> {
    logger.info("Processing data needed for fork verification.");

    let contract: ContractByName;
    let requestData: TenderlyForkContractUploadRequest;
    try {
      requestData = await this._getForkContractData(flatContracts);
      logger.silly(
        "Obtained request data needed for fork verification:",
        requestData,
      );
    } catch (e) {
      logger.error(
        "Caught and error while trying to obtain data needed for fork verification",
        e,
      );
      return null;
    }

    for (contract of flatContracts) {
      const index = requestData.contracts.findIndex(
        (requestContract) => requestContract.contractName === contract.name,
      );
      if (index === -1) {
        logger.error(
          `Couldn't find a contract '${contract.name}' among the obtained request data.`,
        );
        continue;
      }

      logger.trace("Currently processing contract:", contract.name);
      requestData.contracts[index].networks = {
        [this.vnetID!]: {
          address: contract.address,
          links: contract.libraries,
        },
      };
      logger.trace(`Contract ${contract.name} has been processed,`);
    }

    return requestData;
  }

  private async _getForkContractData(
    flatContracts: ContractByName[],
  ): Promise<TenderlyForkContractUploadRequest> {
    logger.trace("Getting contract data needed for fork verification.");

    const contracts = await getContracts(this.env, flatContracts);
    if (contracts.length === 0) {
      throw new Error(
        "Fork verification failed due to bad processing of data in /artifacts folder.",
      );
    }

    const solcConfig = getCompilerDataFromContracts(
      contracts,
      flatContracts,
      this.env.config,
    );
    if (solcConfig === undefined) {
      logger.error(NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG);
    }

    return {
      contracts,
      config: solcConfig!,
      root: this.head!,
    };
  }

  private _checkNetwork(): boolean {
    if (!isTenderlyNetworkConfig(this.env.network.config)) {
      logger.error(
        `Warning in ${PLUGIN_NAME}: Network is not set to 'tenderly'. Please call the task again with --network tenderly`,
      );
      return false;
    }
    return true;
  }

  /**
   * Note: _configureTenderlyRPCInstance needs to be deleted this is only a temporary solution.
   * @deprecated
   */
  private _configureTenderlyRPCInstance(): axios.AxiosInstance {
    const tdlyConfig = getConfig();
    return axios.default.create({
      baseURL: TENDERLY_JSON_RPC_BASE_URL,
      headers: {
        "x-access-key": tdlyConfig.access_key,
        Head: tdlyConfig.head !== undefined ? tdlyConfig.head : "",
      },
    });
  }
}
