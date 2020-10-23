import fs from "fs";
import * as yaml from "js-yaml";
import os from "os";
import path from "path";

import {TenderlyApiService} from "./tenderly/TenderlyApiService";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {ContractByName, TenderlyContractUploadRequest, TenderlyForkContractUploadRequest} from "./tenderly/types";
import {NetworkMap, PluginName} from "./index";
import {getContracts} from "./util";
import {TenderlyService} from "./tenderly/TenderlyService";


export class TenderlyRPC {
  public host: string;
  public connected: boolean;
  public accessKey: string;
  public head: string | undefined;
  public fork: string | undefined;
  public tenderlyAPI: axios.AxiosInstance;
  public accounts: Record<string, string> | undefined;
  public env: HardhatRuntimeEnvironment;


  private filepath = os.homedir() + path.sep + ".tenderly" + path.sep + "config.yaml";

  constructor(hre: HardhatRuntimeEnvironment) {
    this.env = hre
    this.connected = true;

    const fileData = fs.readFileSync(this.filepath);
    const yamlData = yaml.load(fileData.toString());

    this.accessKey = yamlData.access_key;
    this.head = yamlData.head;
    this.fork = yamlData.fork

    this.tenderlyAPI = TenderlyApiService.configureTenderlyRPCInstance()
    this.host = this.tenderlyAPI.defaults.baseURL!
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
      const resp = await this.tenderlyAPI.post("", payload);

      this.head = resp.headers["head"]

      this.writeHead()
      cb(null, resp.data);
    } catch (err) {
      console.log(err.response.data);
      cb(err.response.data);
    }
  }

  private writeHead() {
    const fileData = fs.readFileSync(this.filepath);
    const yamlData = yaml.load(fileData.toString());

    yamlData.head = this.head

    fs.writeFileSync(this.filepath, yaml.safeDump(yamlData), "utf8")
  }

  private async initializeFork() {
    const username: string = this.env.config.tenderly.username
    const projectID: string = this.env.config.tenderly.project
    try {
      const resp = await this.tenderlyAPI.post(
        `/account/${username}/project/${projectID}/fork`,
        {network_id: "1"}
      );
      this.head = resp.data.root_transaction.id;
      this.accounts = resp.data.simulation_fork.accounts;
      this.fork = resp.data.simulation_fork.id
    } catch (err) {
      throw err;
    }
  }

  public resetFork(): string | undefined {
    const fileData = fs.readFileSync(this.filepath);
    const yamlData = yaml.load(fileData.toString());

    const oldHead = yamlData.head

    delete yamlData.head
    delete yamlData.fork

    fs.writeFileSync(this.filepath, yaml.safeDump(yamlData), "utf8")

    return oldHead
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
        this.fork!,
      );
    } catch (err) {
      console.log(err.message);
    }
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
        [NetworkMap[this.fork!]]: {
          address: contract.address
        }
      };
    }

    return requestData;
  }

  private async getForkContractData(): Promise<TenderlyForkContractUploadRequest> {
    const config = this.env.config;
    const contracts = await getContracts(this.env)

    const solcConfig = {
      compiler_version: config.solidity.compilers[0].version,
      optimizations_used: config.solidity.compilers[0].settings.optimizer.enabled,
      optimizations_count: config.solidity.compilers[0].settings.optimizer.runs
    };

    return {
      contracts,
      config: solcConfig,
      root: this.head!
    };
  }
}
