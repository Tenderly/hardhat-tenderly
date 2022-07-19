import * as axios from "axios";
import fs from "fs";
import { HardhatPluginError } from "hardhat/plugins";
import * as yaml from "js-yaml";
import { homedir } from "os";
import { sep } from "path";

import { PluginName } from "../constants";

import {
  TENDERLY_API_BASE_URL,
  TENDERLY_DASHBOARD_BASE_URL,
  TENDERLY_RPC_BASE
} from "./TenderlyService";
import { TenderlyKeyConfig } from "./types";

export class TenderlyApiService {
  public static configureInstance(): axios.AxiosInstance {
    const yamlData = this.getTenderlyConfig();
    return axios.default.create({
      baseURL: TENDERLY_API_BASE_URL,
      headers: { "x-access-key": yamlData.access_key }
    });
  }

  public static configureTenderlyRPCInstance(): axios.AxiosInstance {
    const yamlData = this.getTenderlyConfig();
    return axios.default.create({
      baseURL: TENDERLY_RPC_BASE,
      headers: {
        "x-access-key": yamlData.access_key,
        Head: yamlData.head !== undefined ? yamlData.head : ""
      }
    });
  }

  public static configureAnonymousInstance(): axios.AxiosInstance {
    return axios.default.create({
      baseURL: TENDERLY_API_BASE_URL
    });
  }

  public static isAuthenticated(): boolean {
    try {
      this.getTenderlyConfig();
      return true;
    } catch (e) {
      return false;
    }
  }

  private static getTenderlyConfig(): TenderlyKeyConfig {
    const filepath = homedir() + sep + ".tenderly" + sep + "config.yaml";
    const fileData = fs.readFileSync(filepath);
    const yamlData: TenderlyKeyConfig = yaml.load(fileData.toString());

    if (yamlData.access_key == null) {
      throw new HardhatPluginError(
        PluginName,
        `Access token not provided at filepath ${filepath}.\n` +
          `You can find the token at ${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`
      );
    }
    return yamlData;
  }
}
