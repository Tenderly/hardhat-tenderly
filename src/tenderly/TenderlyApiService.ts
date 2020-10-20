import {HardhatPluginError} from "hardhat/plugins";
import * as axios from "axios";
import fs from "fs";
import * as yaml from "js-yaml";
import {homedir} from "os";
import {sep} from "path";

import {PluginName} from "../index";

import {
  TENDERLY_API_BASE_URL,
  TENDERLY_DASHBOARD_BASE_URL
} from "./TenderlyService";
import {TenderlyKeyConfig} from "./types";

export class TenderlyApiService {
  public static configureInstance(): axios.AxiosInstance {
    const yamlData = this.getTenderlyConfig();
    return axios.default.create({
      baseURL: TENDERLY_API_BASE_URL,
      headers: {"x-access-key": yamlData.access_key}
    });
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
