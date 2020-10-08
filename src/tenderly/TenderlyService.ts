import {TenderlyContractUploadRequest, ContractResponse, ApiContract} from "./types"
import {PluginName, ReverseNetworkMap} from "../index"
import {TenderlyApiService} from "./TenderlyApiService";

export const TENDERLY_API_BASE_URL = "http://localhost:8000"
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

      const responseData: ContractResponse = response.data

      let contract: ApiContract

      console.log("Smart Contracts successfully verified")
      console.group()
      for (contract of responseData.contracts) {
        const contractLink = `${TENDERLY_DASHBOARD_BASE_URL}/contract/${ReverseNetworkMap[contract.network_id]}/${contract.address}`
        console.log(`Contract ${contract.address} verified. You can view the contract at ${contractLink}`)
      }
      console.groupEnd()
    } catch (error) {
      console.log(`Error in ${PluginName}: There was an error during the request. Contract verification failed`)
    }
  }

  public static async pushContracts(
    request: TenderlyContractUploadRequest,
    tenderlyProject: string,
    username: string,
  ) {
    const tenderlyApi = TenderlyApiService.configureInstance();

    try {
      await tenderlyApi.post(
        `/api/v1/account/${username}/project/${tenderlyProject}/contracts`,
        {...request}
      )

      const dashLink = `${TENDERLY_DASHBOARD_BASE_URL}/${username}/${tenderlyProject}/contracts`

      console.log(`Successfully pushed Smart Contracts for project ${tenderlyProject}. You can view your contracts at ${dashLink}`)
    } catch (error) {
      console.log(`Error in ${PluginName}: There was an error during the request. Contract push failed`)
    }
  }
}
