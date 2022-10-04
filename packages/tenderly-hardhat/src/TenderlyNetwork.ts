import * as axios from "axios";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyService, VirtualNetworkService } from "tenderly";
import { TenderlyForkContractUploadRequest } from "tenderly/types";
import { getConfig, writeConfig } from "tenderly/utils/config";
import { TENDERLY_JSON_RPC_BASE_URL } from "tenderly/common/constants";

import { PLUGIN_NAME } from "./constants";
import { ContractByName } from "./tenderly/types";
import { NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG } from "./tenderly/errors";
import { getCompilerDataFromContracts, getContracts } from "./utils/util";

export class TenderlyNetwork {
  public host: string;
  public connected: boolean;
  public accessKey: string;
  public head: string | undefined;
  public forkID: string | undefined;
  public tenderlyJsonRpc: axios.AxiosInstance;
  public accounts: Record<string, string> | undefined;
  public env: HardhatRuntimeEnvironment;

  private tenderlyService = new TenderlyService(PLUGIN_NAME);
  private virtualNetworkService = new VirtualNetworkService(PLUGIN_NAME);

  constructor(hre: HardhatRuntimeEnvironment) {
    this.env = hre;
    this.connected = true;

    const tdlyGlobalConfig = getConfig();
    this.accessKey = tdlyGlobalConfig?.access_key;

    this.tenderlyJsonRpc = this._configureTenderlyRPCInstance();
    this.host = this.tenderlyJsonRpc.defaults.baseURL!;

    if (hre.network.name === "tenderly" && "url" in hre.network.config && hre.network.config.url !== undefined) {
      this.forkID = hre.network.config.url.split("/").pop();
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

  public async verify(...contracts: any[]) {
    console.log("verify: ", contracts);
    if (!this._checkNetwork()) {
      return;
    }

    // Try to override forkID with VNet fork ID
    const vnet = await this.virtualNetworkService.getLocalVNet();
    if (vnet?.id !== undefined && vnet?.id !== null) {
      this.forkID = vnet.id;
    }
    if (this.head === undefined && this.forkID === undefined) {
      await this.initializeFork();
    }

    const flatContracts: ContractByName[] = contracts.reduce((accumulator, value) => accumulator.concat(value), []);
    const requestData = await this._filterContracts(flatContracts);
    if (requestData === null) {
      return;
    }
    if (requestData?.contracts.length === 0) {
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
    // Try to override forkID with VNet fork ID
    const vnet = await this.virtualNetworkService.getLocalVNet();
    if (vnet?.id !== undefined && vnet?.id !== null) {
      this.forkID = vnet.id;
    }

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

    // Try to override forkID with VNet fork ID
    const vnet = await this.virtualNetworkService.getLocalVNet();
    if (vnet?.id !== undefined && vnet?.id !== null) {
      this.forkID = vnet.id;
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
    if (!this._checkNetwork()) {
      return;
    }
    if (this.env.config.tenderly?.forkNetwork === undefined) {
      return;
    }

    const username: string = this.env.config.tenderly.username;
    const projectID: string = this.env.config.tenderly.project;
    try {
      const resp = await this.tenderlyJsonRpc.post(`/account/${username}/project/${projectID}/fork`, {
        network_id: this.env.config.tenderly.forkNetwork,
      });
      this.head = resp.data.root_transaction.id;
      this.accounts = resp.data.simulation_fork.accounts;
      this.forkID = resp.data.simulation_fork.id;
    } catch (err) {
      throw err;
    }
  }

  private _writeHead() {
    const tdlyGlobalConfig = getConfig();
    tdlyGlobalConfig.head = this.head;
    writeConfig(tdlyGlobalConfig);
  }

  private async _filterContracts(flatContracts: ContractByName[]): Promise<TenderlyForkContractUploadRequest | null> {
    let contract: ContractByName;
    let requestData: TenderlyForkContractUploadRequest;
    try {
      requestData = await this._getForkContractData(flatContracts);
    } catch (e) {
      return null;
    }

    for (contract of flatContracts) {
      const index = requestData.contracts.findIndex(
        (requestContract) => requestContract.contractName === contract.name
      );
      if (index === -1) {
        continue;
      }
      requestData.contracts[index].networks = {
        [this.forkID!]: {
          address: contract.address,
          links: contract.libraries,
        },
      };
    }

    return requestData;
  }

  private async _getForkContractData(flatContracts: ContractByName[]): Promise<TenderlyForkContractUploadRequest> {
    const contracts = await getContracts(this.env, flatContracts);
    if (contracts.length === 0) {
      throw new Error("Failed to get contracts");
    }

    const solcConfig = getCompilerDataFromContracts(contracts, flatContracts, this.env.config);

    if (solcConfig === undefined) {
      console.log(NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG);
    }

    return {
      contracts,
      config: solcConfig!,
      root: this.head!,
    };
  }

  private _checkNetwork(): boolean {
    if (this.env.network.name !== "tenderly") {
      console.log(
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
