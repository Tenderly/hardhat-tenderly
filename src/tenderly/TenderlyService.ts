import { PluginName, ReverseNetworkMap } from "../constants";
import { logError } from "../utils/error_logger";

import {
  API_VERIFICATION_REQUEST_ERROR,
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
import { VNet, VNetTransaction } from "./types/VNet";

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

  public static async getLatestBlockNumber(networkId: string): Promise<string> {
    let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
    const apiPath = `/api/v1/network/${networkId}/block-number`;

    if (TenderlyApiService.isAuthenticated()) {
      tenderlyApi = TenderlyApiService.configureInstance();
    }

    let response: string = "";
    try {
      response = (await tenderlyApi.get(apiPath)).data.block_number;
    } catch (e) {
      console.log(
        `Error in ${PluginName}: There was an error during the request. Latest block number fetch failed`
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
      logError(error);
      console.log(API_VERIFICATION_REQUEST_ERROR);
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
        `Successfully privately verified Smart Contracts for project ${tenderlyProject}. You can view your contracts at ${dashLink}`
      );
    } catch (error) {
      logError(error);
      console.log(API_VERIFICATION_REQUEST_ERROR);
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
      logError(error);
      console.log(API_VERIFICATION_REQUEST_ERROR);
    }
  }

  public static async createVNet(
    accountId: string,
    projectSlug: string,
    networkId: string,
    blockNumber: string
  ): Promise<VNet> {
    const tenderlyApi = TenderlyApiService.configureInstance();

    const apiPath = `/api/v1/account/${accountId}/project/${projectSlug}/fork`;

    let response;
    try {
      response = (
        await tenderlyApi.post(apiPath, {
          network_id: networkId,
          blockNumber: blockNumber,
          vnet: true,
        })
      ).data;
    } catch (e) {
      console.log(
        `Error in ${PluginName}: There was an error during the request. VNet creation failed`
      );
    }
    return {
      vnetId: response.simulation_fork.id,
      rootTxId: response.root_transaction.id,
    };
  }

  public static async getVNetTransaction(
    accountId: string,
    projectSlug: string,
    forkId: string,
    transactionId: string
  ): Promise<VNetTransaction> {
    const tenderlyApi = TenderlyApiService.configureInstance();

    const apiPath = `/api/v1/account/${accountId}/project/${projectSlug}/fork/${forkId}/transaction/${transactionId}`;

    let response: VNetTransaction;
    try {
      response = (await tenderlyApi.get(apiPath)).data.fork_transaction;
    } catch (e) {
      console.log(
        `Error in ${PluginName}: There was an error during the request. VNet transaction fetch failed`
      );
    }
    return response!;
  }
}
