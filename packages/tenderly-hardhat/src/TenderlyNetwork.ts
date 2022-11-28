import * as axios from "axios";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyService } from "tenderly";
import { TenderlyForkContractUploadRequest } from "tenderly/types";
import { getConfig, writeConfig } from "tenderly/utils/config";
import { TENDERLY_JSON_RPC_BASE_URL } from "tenderly/common/constants";

import { PLUGIN_NAME } from "./constants";
import { ContractByName } from "./tenderly/types";
import { NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG } from "./tenderly/errors";
import { getCompilerDataFromContracts, getContracts } from "./utils/util";
import { logger } from "./utils/logger";

export class TenderlyNetwork {
  public host: string;
  public connected: boolean;
  public accessKey: string;
  public head: string | undefined;
  public forkID: string | undefined;
  public tenderlyJsonRpc: axios.AxiosInstance;
  public accounts: Record<string, string> | undefined;
  public env: HardhatRuntimeEnvironment;

  private tenderlyService = new TenderlyService(PLUGIN_NAME, Number(process.env.MIN_LOG_LEVEL));

  constructor(hre: HardhatRuntimeEnvironment) {
    logger.debug("Making an interface towards tenderly network...");

    this.env = hre;
    this.connected = true;

    const tdlyGlobalConfig = getConfig();
    logger.info("Obtained global tenderly config:", tdlyGlobalConfig);

    this.accessKey = tdlyGlobalConfig?.access_key;

    this.tenderlyJsonRpc = this._configureTenderlyRPCInstance();
    this.host = this.tenderlyJsonRpc.defaults.baseURL!;
    logger.info("Obtained tenderly json rpc:", tdlyGlobalConfig);

    if (hre.network.name === "tenderly" && "url" in hre.network.config && hre.network.config.url !== undefined) {
      this.forkID = hre.network.config.url.split("/").pop();
      logger.info("Fork ID is:", this.forkID);
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
    // I won't put logs here because it isn't called from anywhere
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

  public async verify(...contracts: any[]) {
    logger.info("Fork verification has been called.");
    if (!this._checkNetwork()) {
      return;
    }

    if (this.head === undefined && this.forkID === undefined) {
      logger.warn("Head or fork are not initialized.");
      await this.initializeFork();
    }

    const flatContracts: ContractByName[] = contracts.reduce((accumulator, value) => accumulator.concat(value), []);
    const requestData = await this._filterContracts(flatContracts);
    logger.silly("Obtained request data needed for verifying contracts:", requestData);

    if (requestData === null) {
      logger.error("Filtering contracts did not succeed.");
      return;
    }
    if (requestData?.contracts.length === 0) {
      logger.error("Filtering contracts did not succeed. The length of the contracts is 0.");
      return;
    }

    await this.tenderlyService.verifyForkContracts(
      requestData,
      this.env.config.tenderly.project,
      this.env.config.tenderly.username,
      this.forkID!
    );
  }

  public async verifyAPI(
    request: TenderlyForkContractUploadRequest,
    tenderlyProject: string,
    username: string,
    forkID: string
  ) {
    logger.info("Fork verification via API has been called,");
    await this.tenderlyService.verifyForkContracts(request, tenderlyProject, username, forkID);
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

  public async getForkID(): Promise<string | undefined> {
    if (!this._checkNetwork()) {
      return;
    }

    return this.forkID;
  }

  public setFork(fork: string | undefined): void {
    if (!this._checkNetwork()) {
      return;
    }
    this.forkID = fork;
  }

  public async initializeFork() {
    logger.debug("Fork initialization has been called.");

    if (!this._checkNetwork()) {
      return;
    }
    if (this.env.config.tenderly?.forkNetwork === undefined) {
      logger.error("There is no information about the fork network. Fork won't be initialized");
      return;
    }

    const username: string = this.env.config.tenderly.username;
    const projectID: string = this.env.config.tenderly.project;
    logger.trace("Username and projectID obtained from tenderly configuration:", { username, projectID });

    try {
      logger.debug("Making a call to initialize fork...");
      const resp = await this.tenderlyJsonRpc.post(`/account/${username}/project/${projectID}/fork`, {
        network_id: this.env.config.tenderly.forkNetwork,
      });

      logger.trace("Obtained information from a call:", resp);

      this.head = resp.data.root_transaction.id;
      this.accounts = resp.data.simulation_fork.accounts;
      this.forkID = resp.data.simulation_fork.id;

      logger.debug("Successfully initialized fork.");
    } catch (err) {
      logger.error("Error was caught while calling fork initialization:", err);
      throw err;
    }
  }

  private _writeHead() {
    const tdlyGlobalConfig = getConfig();
    tdlyGlobalConfig.head = this.head;
    writeConfig(tdlyGlobalConfig);
  }

  private async _filterContracts(flatContracts: ContractByName[]): Promise<TenderlyForkContractUploadRequest | null> {
    logger.info("Filtering contracts for fork verification has been called.");

    let contract: ContractByName;
    let requestData: TenderlyForkContractUploadRequest;
    try {
      requestData = await this._getForkContractData(flatContracts);
      logger.silly("Obtained request data needed for fork verification:", requestData);
    } catch (e) {
      logger.error("Caught and error while trying to obtain data needed for fork verification", e);
      return null;
    }

    for (contract of flatContracts) {
      const index = requestData.contracts.findIndex(
        (requestContract) => requestContract.contractName === contract.name
      );
      if (index === -1) {
        logger.error(`Couldn't find a contract '${contract.name}' among the obtained request data.`);
        continue;
      }

      logger.trace("Currently processing contract:", contract.name);
      requestData.contracts[index].networks = {
        [this.forkID!]: {
          address: contract.address,
          links: contract.libraries,
        },
      };
      logger.trace(`Contract ${contract.name} has been processed,`);
    }

    return requestData;
  }

  private async _getForkContractData(flatContracts: ContractByName[]): Promise<TenderlyForkContractUploadRequest> {
    logger.trace("Getting contract data for fork verification has been called.");

    const contracts = await getContracts(this.env, flatContracts);
    if (contracts.length === 0) {
      throw new Error("Failed to get contracts");
    }

    const solcConfig = getCompilerDataFromContracts(contracts, flatContracts, this.env.config);

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
    if (this.env.network.name !== "tenderly") {
      logger.error(
        `Warning in ${PLUGIN_NAME}: Network is not set to tenderly. Please call the task again with --network tenderly`
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
