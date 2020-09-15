import {AxiosInstance} from "axios";
import axios from "axios"
import {TenderlyKeyConfig} from "./types";
import {homedir} from "os";
import fs from "fs";
import * as yaml from "js-yaml";
import {BuidlerPluginError} from "@nomiclabs/buidler/plugins";
import {PluginName} from "../index";
import {TENDERLY_API_BASE_URL, TENDERLY_DASHBOARD_BASE_URL} from "./TenderlyService";

export class TenderlyApiService {
  public static configureInstance(): AxiosInstance {
    const yamlData = this.getTenderlyConfig()
    return axios.create({
      baseURL: TENDERLY_API_BASE_URL,
      headers: {"x-access-key": yamlData.access_key}
    })
  }

  private static getTenderlyConfig(): TenderlyKeyConfig {
    const filepath = homedir() + "/.tenderly/config.yaml"
    const fileData = fs.readFileSync(filepath)
    const yamlData: TenderlyKeyConfig = yaml.load(fileData.toString())

    if (yamlData.access_key == null) {
      throw new BuidlerPluginError(PluginName, `Access token not provided at filepath ${filepath}.\n` +
        `You can find the token at ${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`)
    }

    return yamlData
  }
}
