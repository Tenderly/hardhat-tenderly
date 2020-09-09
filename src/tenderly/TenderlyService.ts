import {BuidlerPluginError} from "@nomiclabs/buidler/plugins"
import {TenderlyContractUploadRequest, TenderlyConfig} from "./types"
import axios from "axios"
import {homedir} from "os";
import * as yaml from "js-yaml"
import fs from "fs"
import {PluginName} from "../index"

const TENDERLY_API_BASE_URL = "https://api.tenderly.co"
const TENDERLY_DASHBOARD_BASE_URL = "https://dashboard.tenderly.co"

export class TenderlyService {
  public static async verifyContracts(
    request: TenderlyContractUploadRequest
  ) {
    const yamlData = this.getTenderlyConfig()

    const tenderlyApiInstance = axios.create({
      baseURL: TENDERLY_API_BASE_URL,
      headers: {"x-access-key": yamlData.access_key}
    })

    try {
      const response = await tenderlyApiInstance.post(
        "/api/v1/account/me/verify-contracts",
        {...request}
      )
      const dashLink = `${TENDERLY_DASHBOARD_BASE_URL}/explorer`

      console.log(`Smart Contracts successfully verified. You can view your contracts at ${dashLink}`)
    } catch (error) {
      console.log(`Error in ${PluginName}: There was an error during the request. Contract verification failed`)
    }
  }

  public static async pushContracts(
    request: TenderlyContractUploadRequest,
    projectSlug: string,
    username: string,
  ) {
    const yamlData = this.getTenderlyConfig()

    const tenderlyApiInstance = axios.create({
      baseURL: TENDERLY_API_BASE_URL,
      headers: {"x-access-key": yamlData.access_key}
    })

    try {
      const response = await tenderlyApiInstance.post(
        `/api/v1/account/${username}/project/${projectSlug}/contracts`,
        {...request}
      )

      const dashLink = `${TENDERLY_DASHBOARD_BASE_URL}/${username}/${projectSlug}/contracts`

      console.log(`Successfully pushed Smart Contracts for project ${projectSlug}. You can view your contracts at ${dashLink}`)
    } catch (error) {
      console.log(`Error in ${PluginName}: There was an error during the request. Contract push failed`)
      console.log(error.response)
    }
  }

  private static getTenderlyConfig(): TenderlyConfig {
    const filepath = homedir() + "/.tenderly/config.yaml"
    const fileData = fs.readFileSync(filepath)
    const yamlData: TenderlyConfig = yaml.load(fileData.toString())

    if (yamlData.access_key == null) {
      throw new BuidlerPluginError(PluginName, `Access token not provided at filepath ${filepath}.\n` +
        `You can find the token at ${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`)
    }

    return yamlData
  }
}
