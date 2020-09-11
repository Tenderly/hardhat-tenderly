import {BuidlerPluginError} from "@nomiclabs/buidler/plugins"
import {TenderlyContractUploadRequest, TenderlyConfig} from "./types"
import axios from "axios"
import {homedir} from "os";
import * as yaml from "js-yaml"
import fs from "fs"
import {PluginName} from "../index"
import {TenderlyApiService} from "./TenderlyApiService";

export const TENDERLY_API_BASE_URL = "https://api.tenderly.co"
export const TENDERLY_DASHBOARD_BASE_URL = "https://dashboard.tenderly.co"

export class TenderlyService {
  public static async verifyContracts(
    request: TenderlyContractUploadRequest
  ) {
    const tenderlyApi = TenderlyApiService.configureInstance();

    try {
      const response = await tenderlyApi.post(
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
    const tenderlyApi = TenderlyApiService.configureInstance();

    try {
      const response = await tenderlyApi.post(
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
}
