import * as axios from "axios";
import fs from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as yaml from "js-yaml";
import os from "os";
import path from "path";

import { TenderlyApiService } from "./tenderly/TenderlyApiService";
import { TenderlyService } from "./tenderly/TenderlyService";
import {
  ContractByName,
  TenderlyForkContractUploadRequest
} from "./tenderly/types";
import { getContracts } from "./util";

export class TenderlyRPC {
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
  }

  public supportsSubscriptions() {
    return false;
  }

  public disconnect() {
    return true;
  }

  public async send(payload, cb) {
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
    if (this.head === undefined) {
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

  public getHead(): string | undefined {
    return this.head;
  }

  public setHead(head: string | undefined): void {
    this.head = head;
  }

  public getFork(): string | undefined {
    return this.fork;
  }

  public setFork(fork: string | undefined): void {
    this.fork = fork;
  }

  public async initializeFork() {
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
    const requestData = await this.getForkContractData();

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

  private async getForkContractData(): Promise<
    TenderlyForkContractUploadRequest
  > {
    const config = this.env.config;
    const contracts = await getContracts(this.env);

    const solcConfig = {
      compiler_version: config.solidity.compilers[0].version,
      optimizations_used:
        config.solidity.compilers[0].settings.optimizer.enabled,
      optimizations_count: config.solidity.compilers[0].settings.optimizer.runs,
      evm_version: config.solidity.compilers[0].settings.evmVersion
    };

    return {
      contracts,
      config: solcConfig,
      root: this.head!
    };
  }
}
