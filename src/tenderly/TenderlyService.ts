import {BuidlerPluginError} from "@nomiclabs/buidler/plugins"
import {TenderlyContractUploadRequest, TenderlyConfig} from "./types"
import axios from "axios"
import {homedir} from "os";
import * as yaml from "js-yaml"
import fs from "fs"
import {PluginName} from "../index"

export const verifyContract = async (
  request: TenderlyContractUploadRequest
) => {
  const filepath = homedir() + "/.tenderly/config.yaml"
  const fileData = fs.readFileSync(filepath)
  const yamlData: TenderlyConfig = yaml.load(fileData.toString())

  if (yamlData.access_key == null) {
    throw new BuidlerPluginError(PluginName, `Access key not provided at filepath ${filepath}`)
  }

  const tenderlyApiInstance = axios.create({
    baseURL: "https://api.tenderly.co",
    headers: {"x-access-key": yamlData.access_key}
  })

  try {
    const response = await tenderlyApiInstance.post(
      "/api/v1/account/me/verify-contracts",
      {...request}
    )
    const dashLink = "https://dashboard.tenderly.co/explorer"

    console.log(`Smart Contracts successfully verified. You can view your contracts at ${dashLink}`)
  } catch (error) {
    console.log(`Error in ${PluginName}: There was an error during the request. Contract verification failed`)
  }
}

export const pushContract = async (
  request: TenderlyContractUploadRequest,
  projectSlug: string,
  username: string,
) => {
  const filepath = homedir() + "/.tenderly/config.yaml"
  const fileData = fs.readFileSync(filepath)
  const yamlData: TenderlyConfig = yaml.load(fileData.toString())

  if (yamlData.access_key == null) {
    throw new BuidlerPluginError(PluginName, `Access key not provided at filepath ${filepath}`)
  }

  const tenderlyApiInstance = axios.create({
    baseURL: "https://api.tenderly.co",
    headers: {"x-access-key": yamlData.access_key}
  })

  try {
    const response = await tenderlyApiInstance.post(
      `/api/v1/account/${username}/project/${projectSlug}/contracts`,
      {...request}
    )

    const dashLink = `https://dashboard.tenderly.co/${username}/${projectSlug}/contracts`

    console.log(`Successfully pushed Smart Contracts for project ${projectSlug}. You can view your contracts at ${dashLink}`)
  } catch (error) {
    console.log(`Error in ${PluginName}: There was an error during the request. Contract push failed`)
    console.log(error.response)
  }
}
