import fs from "fs";
import * as yaml from "js-yaml";
import os from "os";
import path from "path";

import {TenderlyApiService} from "./tenderly/TenderlyApiService";
import {HardhatRuntimeEnvironment} from "hardhat/types";


export class TenderlyRPC {
  public host: string;
  public connected: boolean;
  public accessKey: string;
  public head: string | undefined;
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
    }
   catch (err) {
        throw err;
      }
    }
  
    public resetFork(): string | undefined {
      const fileData = fs.readFileSync(this.filepath);
      const yamlData = yaml.load(fileData.toString());
  
      const oldHead = yamlData.head
  
      delete yamlData.head
  
      fs.writeFileSync(this.filepath, yaml.safeDump(yamlData), "utf8")
  
      return oldHead
    }
  }
