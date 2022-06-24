import { PluginName, ReverseNetworkMap } from "../index";

import {
  API_REQUEST_ERROR,
  BYTECODE_MISMATCH_ERROR,
  NO_NEW_CONTRACTS_VERIFIED_ERROR,
  NO_VERIFIABLE_CONTRACTS_ERROR
} from "./errors";
import { TenderlyApiService } from "./TenderlyApiService";
import {
  ApiContract,
  ContractResponse,
  TenderlyContractUploadRequest,
  TenderlyForkContractUploadRequest
} from "./types";
import { TenderlyPublicNetwork } from "./types/Network";

export const TENDERLY_API_BASE_URL = "https://api.tenderly.co";
export const TENDERLY_DASHBOARD_BASE_URL = "https://dashboard.tenderly.co";
export const TENDERLY_RPC_BASE = "https://rpc.tenderly.co";

export class TenderlyService {
  public static async getPublicNetworks(): Promise<TenderlyPublicNetwork[]> {
    let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
    const apiPath = "/api/v1/public-networks";

    if (TenderlyApiService.isAuthenticated()) {
      tenderlyApi = TenderlyApiService.configureInstance();
    }

    let response: TenderlyPublicNetwork[] = [];
    try {
      response = (await tenderlyApi.get(apiPath)).data;
    } catch (e) {
      console.log(
        `Error in ${PluginName}: There was an error during the request. Network fetch failed`
      );
    }
    return response;
  }
  public static async verifyContracts(request: TenderlyContractUploadRequest) {
    let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
    const apiPath = "/api/v1/public/verify-contracts";

    if (TenderlyApiService.isAuthenticated()) {
      tenderlyApi = TenderlyApiService.configureInstance();
    }

    try {
      if (!request.contracts.length) {
        console.log(NO_VERIFIABLE_CONTRACTS_ERROR);
        return;
      }

      const response = await tenderlyApi.post(apiPath, { ...request });

      const responseData: ContractResponse = response.data;

      let contract: ApiContract;

      if (responseData.bytecode_mismatch_errors != null) {
        console.log(BYTECODE_MISMATCH_ERROR);
        return;
      }

      if (!responseData.contracts?.length) {
        let addresses = "";
        for (const cont of request.contracts) {
          addresses += cont.contractName + ", ";
        }

        console.log(NO_NEW_CONTRACTS_VERIFIED_ERROR, addresses);
        return;
      }

      console.log("Smart Contracts successfully verified");
      console.group();
      for (contract of responseData.contracts) {
        const contractLink = `${TENDERLY_DASHBOARD_BASE_URL}/contract/${
          ReverseNetworkMap[contract.network_id]
        }/${contract.address}`;
        console.log(
          `Contract ${contract.address} verified. You can view the contract at ${contractLink}`
        );
      }
      console.groupEnd();
    } catch (error) {
      console.log(error?.response.status);
      console.log(error?.response.statusText);
      console.log(error?.response?.data?.error?.message);
      console.log(API_REQUEST_ERROR);
    }
  }
  public static async pushContracts(
    request: TenderlyContractUploadRequest,
    tenderlyProject: string,
    username: string
  ) {
    const tenderlyApi = TenderlyApiService.configureInstance();

    try {
      const response = await tenderlyApi.post(
        `/api/v1/account/${username}/project/${tenderlyProject}/contracts`,
        { ...request }
      );

      const responseData: ContractResponse = response.data;

      if (responseData.bytecode_mismatch_errors != null) {
        console.log(BYTECODE_MISMATCH_ERROR);
        return;
      }

      if (!responseData.contracts?.length) {
        let addresses = "";
        for (const cont of request.contracts) {
          addresses += cont.contractName + ", ";
        }

        console.log(NO_NEW_CONTRACTS_VERIFIED_ERROR, addresses);
        return;
      }

      const dashLink = `${TENDERLY_DASHBOARD_BASE_URL}/${username}/${tenderlyProject}/contracts`;

      console.log(
        `Successfully pushed Smart Contracts for project ${tenderlyProject}. You can view your contracts at ${dashLink}`
      );
    } catch (error) {
      console.log(error?.response.status);
      console.log(error?.response.statusText);
      console.log(error?.response?.data?.error?.message);
      console.log(API_REQUEST_ERROR);
    }
  }

  public static async verifyForkContracts(
    request: TenderlyForkContractUploadRequest,
    tenderlyProject: string,
    username: string,
    fork: string
  ) {
    const tenderlyApi = TenderlyApiService.configureTenderlyRPCInstance();

    try {
      const response = await tenderlyApi.post(
        `/account/${username}/project/${tenderlyProject}/fork/${fork}/verify`,
        { ...request }
      );

      const responseData: ContractResponse = response.data;

      if (responseData.bytecode_mismatch_errors != null) {
        console.log(BYTECODE_MISMATCH_ERROR);
        return;
      }

      if (!responseData.contracts?.length) {
        let addresses = "";
        for (const cont of request.contracts) {
          addresses += cont.contractName + ", ";
        }

        console.log(NO_NEW_CONTRACTS_VERIFIED_ERROR, addresses);
        return;
      }

      console.group();
      for (const contract of responseData.contracts) {
        console.log(`Contract at ${contract.address} verified.`);
      }
      console.groupEnd();
    } catch (error) {
      console.log(error?.response.status);
      console.log(error?.response.statusText);
      console.log(error?.response?.data?.error?.message);
      console.log(API_REQUEST_ERROR);
    }
  }
}
