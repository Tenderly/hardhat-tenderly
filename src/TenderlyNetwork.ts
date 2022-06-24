import * as axios from "axios";
import fs from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as yaml from "js-yaml";
import os from "os";
import path from "path";

import { PluginName } from "./index";
import { NO_COMPILER_FOUND_FOR_CONTRACT } from "./tenderly/errors";
import { TenderlyApiService } from "./tenderly/TenderlyApiService";
import { TenderlyService } from "./tenderly/TenderlyService";
import {
  ContractByName,
  TenderlyForkContractUploadRequest
} from "./tenderly/types";
import { getCompilerDataFromContracts, getContracts } from "./util";

export class TenderlyNetwork {
  public host: string;
  public connected: boolean;
  public accessKey: string;
  public head: string | undefined;
  public fork: string | undefined;
  public tenderlyAPI: axios.AxiosInstance;
  public accounts: Record<string, string> | undefined;
  public env: HardhatRuntimeEnvironment;

  private filepath =
    os.homedir() + path.sep + ".tenderly" + path.sep + "config.yaml";

  constructor(hre: HardhatRuntimeEnvironment) {
    this.env = hre;
    this.connected = true;

    const fileData = fs.readFileSync(this.filepath);
    const yamlData = yaml.load(fileData.toString());

    this.accessKey = yamlData.access_key;

    this.tenderlyAPI = TenderlyApiService.configureTenderlyRPCInstance();
    this.host = this.tenderlyAPI.defaults.baseURL!;

    if (
      hre.network.name === "tenderly" &&
      "url" in hre.network.config &&
      hre.network.config.url !== undefined
    ) {
      this.fork = hre.network.config.url.split("/").pop();
    }
  }

  public supportsSubscriptions() {
    if (!this.checkNetwork()) {
      return;
    }
    return false;
  }

  public disconnect() {
    if (!this.checkNetwork()) {
      return;
    }
    return true;
  }

  public async send(payload, cb) {
    if (!this.checkNetwork()) {
      return;
    }
    if (this.head === undefined) {
      await this.initializeFork();
    }
    try {
      this.tenderlyAPI.defaults.headers.Head = this.head;
      const resp = await this.tenderlyAPI.post("", payload);

      this.head = resp.headers.head;

      this.writeHead();
      cb(null, resp.data);
    } catch (err) {
      console.log(err.response.data);
      cb(err.response.data);
    }
  }

  public resetFork(): string | undefined {
    const fileData = fs.readFileSync(this.filepath);
    const yamlData = yaml.load(fileData.toString());

    const oldHead = yamlData.head;

    delete yamlData.head;
    delete yamlData.fork;

    fs.writeFileSync(this.filepath, yaml.safeDump(yamlData), "utf8");

    return oldHead;
  }

  public async verify(...contracts) {
    if (!this.checkNetwork()) {
      return;
    }
    if (this.head === undefined && this.fork === undefined) {
      await this.initializeFork();
    }

    const flatContracts: ContractByName[] = contracts.reduce(
      (accumulator, value) => accumulator.concat(value),
      []
    );

    const requestData = await this.filterContracts(flatContracts);

    if (requestData == null) {
      console.log("Fork verification failed");
      return;
    }

    try {
      await TenderlyService.verifyForkContracts(
        requestData,
        this.env.config.tenderly.project,
        this.env.config.tenderly.username,
        this.fork!
      );
    } catch (err) {
      console.log(err.message);
    }
  }

  public async verifyAPI(
    request: TenderlyForkContractUploadRequest,
    tenderlyProject: string,
    username: string,
    forkID: string
  ) {
    try {
      await TenderlyService.verifyForkContracts(
        request,
        tenderlyProject,
        username,
        forkID
      );
    } catch (err) {
      console.log(err.message);
    }
  }
  public getHead(): string | undefined {
    if (!this.checkNetwork()) {
      return;
    }
    return this.head;
  }

  public setHead(head: string | undefined): void {
    if (!this.checkNetwork()) {
      return;
    }
    this.head = head;
  }

  public getFork(): string | undefined {
    if (!this.checkNetwork()) {
      return;
    }
    return this.fork;
  }

  public setFork(fork: string | undefined): void {
    if (!this.checkNetwork()) {
      return;
    }
    this.fork = fork;
  }

  public async initializeFork() {
    if (!this.checkNetwork()) {
      return;
    }
    const username: string = this.env.config.tenderly.username;
    const projectID: string = this.env.config.tenderly.project;
    try {
      const resp = await this.tenderlyAPI.post(
        `/account/${username}/project/${projectID}/fork`,
        { network_id: this.env.config.tenderly.forkNetwork }
      );
      this.head = resp.data.root_transaction.id;
      this.accounts = resp.data.simulation_fork.accounts;
      this.fork = resp.data.simulation_fork.id;
    } catch (err) {
      throw err;
    }
  }

  private writeHead() {
    const fileData = fs.readFileSync(this.filepath);
    const yamlData = yaml.load(fileData.toString());

    yamlData.head = this.head;

    fs.writeFileSync(this.filepath, yaml.safeDump(yamlData), "utf8");
  }

  private async filterContracts(
    flatContracts: ContractByName[]
  ): Promise<TenderlyForkContractUploadRequest | null> {
    let contract: ContractByName;
    let requestData: TenderlyForkContractUploadRequest;
    try {
      requestData = await this.getForkContractData(flatContracts);
    } catch (e) {
      return null;
    }

    for (contract of flatContracts) {
      const index = requestData.contracts.findIndex(
        requestContract => requestContract.contractName === contract.name
      );
      if (index === -1) {
        continue;
      }
      requestData.contracts[index].networks = {
        [this.fork!]: {
          address: contract.address
        }
      };
    }

    return requestData;
  }

  private async getForkContractData(
    flatContracts: ContractByName[]
  ): Promise<TenderlyForkContractUploadRequest> {
    const contracts = await getContracts(this.env, flatContracts);

    const solcConfig = getCompilerDataFromContracts(
      contracts,
      flatContracts,
      this.env.config
    );

    if (solcConfig === undefined) {
      console.log(NO_COMPILER_FOUND_FOR_CONTRACT);
      console.log(flatContracts);
    }

    return {
      contracts,
      config: solcConfig!,
      root: this.head!
    };
  }

  private checkNetwork(): boolean {
    if (this.env.network.name !== "tenderly") {
      console.log(
        `Warning in ${PluginName}: Network is not set to tenderly. Please call the task again with --network tenderly`
      );
      return false;
    }
    return true;
  }
}
