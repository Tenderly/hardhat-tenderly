import { TENDERLY_DASHBOARD_BASE_URL, CHAIN_ID_NETWORK_NAME_MAP } from "../../../common/constants";
import { logApiError } from "../common/logger";
import {
  API_VERIFICATION_REQUEST_ERR_MSG,
  BYTECODE_MISMATCH_ERR_MSG,
  NO_NEW_CONTRACTS_VERIFIED_ERR_MSG,
  NO_VERIFIABLE_CONTRACTS_ERR_MSG,
  NETWORK_FETCH_FAILED_ERR_MSG,
  LATEST_BLOCK_NUMBER_FETCH_FAILED_ERR_MSG,
  ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG,
  VNET_CREATION_FAILED_ERR_MSG,
  TRANSACTION_FETCH_FAILED_ERR_MSG,
  PRINCIPAL_FETCH_FAILED_ERR_MSG,
  PROJECTS_FETCH_FAILED_ERR_MSG,
} from "../common/errors";
import {
  Principal,
  Project,
  TenderlyNetwork,
  ContractResponse,
  TenderlyContractUploadRequest,
  TenderlyForkContractUploadRequest,
} from "../types";
import { VirtualNetwork, Transaction } from "../../virtual-network/types";
import { TenderlyApiService } from "./TenderlyApiService";

export class TenderlyService {
  private pluginName: string;

  constructor(pluginName: string) {
    this.pluginName = pluginName;
  }

  public async getNetworks(): Promise<TenderlyNetwork[]> {
    let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
    if (TenderlyApiService.isAuthenticated()) {
      tenderlyApi = TenderlyApiService.configureInstance();
    }

    try {
      const res = await tenderlyApi.get("/api/v1/public-networks");
      return res.data;
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${NETWORK_FETCH_FAILED_ERR_MSG}`);
    }
    return [];
  }

  public async getLatestBlockNumber(networkId: string): Promise<string | null> {
    let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
    if (TenderlyApiService.isAuthenticated()) {
      tenderlyApi = TenderlyApiService.configureInstance();
    }

    try {
      const res = await tenderlyApi.get(`/api/v1/network/${networkId}/block-number`);
      return res.data.block_number;
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${LATEST_BLOCK_NUMBER_FETCH_FAILED_ERR_MSG}`);
    }
    return null;
  }

  public async verifyContracts(request: TenderlyContractUploadRequest): Promise<void> {
    let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
    if (TenderlyApiService.isAuthenticated()) {
      tenderlyApi = TenderlyApiService.configureInstance();
    }

    try {
      if (request.contracts.length === 0) {
        console.log(NO_VERIFIABLE_CONTRACTS_ERR_MSG);
        return;
      }

      const res = await tenderlyApi.post("/api/v1/public/verify-contracts", { ...request });

      const responseData: ContractResponse = res.data;
      if (responseData.bytecode_mismatch_errors !== null) {
        console.log(`Error in ${this.pluginName}: ${BYTECODE_MISMATCH_ERR_MSG}`);
        return;
      }

      if (responseData.contracts.length === 0) {
        let addresses = "";
        for (const cont of request.contracts) {
          addresses += `${cont.contractName}, `;
        }

        console.log(`Error in ${this.pluginName}: ${NO_NEW_CONTRACTS_VERIFIED_ERR_MSG}`, addresses);
        return;
      }

      console.log("Smart Contracts successfully verified");
      console.group();

      for (const contract of responseData.contracts) {
        const contractLink = `${TENDERLY_DASHBOARD_BASE_URL}/contract/${
          CHAIN_ID_NETWORK_NAME_MAP[contract.network_id]
        }/${contract.address}`;
        console.log(`Contract ${contract.address} verified. You can view the contract at ${contractLink}`);
      }
      console.groupEnd();
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${API_VERIFICATION_REQUEST_ERR_MSG}`);
    }
  }

  public async pushContracts(
    request: TenderlyContractUploadRequest,
    tenderlyProject: string,
    username: string
  ): Promise<void> {
    if (!TenderlyApiService.isAuthenticated()) {
      console.log(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return;
    }

    const tenderlyApi = TenderlyApiService.configureInstance();
    try {
      const res = await tenderlyApi.post(`/api/v1/account/${username}/project/${tenderlyProject}/contracts`, {
        ...request,
      });

      const responseData: ContractResponse = res.data;
      if (responseData.bytecode_mismatch_errors !== null) {
        console.log(`Error in ${this.pluginName}: ${BYTECODE_MISMATCH_ERR_MSG}`);
        return;
      }

      if (responseData.contracts.length === 0) {
        let addresses = "";
        for (const cont of request.contracts) {
          addresses += `${cont.contractName}, `;
        }

        console.log(`Error in ${this.pluginName}: ${NO_NEW_CONTRACTS_VERIFIED_ERR_MSG}`, addresses);
        return;
      }

      const dashLink = `${TENDERLY_DASHBOARD_BASE_URL}/${username}/${tenderlyProject}/contracts`;
      console.log(
        `Successfully privately verified Smart Contracts for project ${tenderlyProject}. You can view your contracts at ${dashLink}`
      );
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${API_VERIFICATION_REQUEST_ERR_MSG}`);
    }
  }

  public async verifyForkContracts(
    request: TenderlyForkContractUploadRequest,
    tenderlyProject: string,
    username: string,
    fork: string
  ): Promise<void> {
    if (!TenderlyApiService.isAuthenticated()) {
      console.log(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return;
    }

    const tenderlyApi = TenderlyApiService.configureTenderlyRPCInstance();
    try {
      const res = await tenderlyApi.post(`/account/${username}/project/${tenderlyProject}/fork/${fork}/verify`, {
        ...request,
      });

      const responseData: ContractResponse = res.data;
      if (responseData.bytecode_mismatch_errors !== null) {
        console.log(BYTECODE_MISMATCH_ERR_MSG);
        return;
      }

      if (responseData.contracts.length === 0) {
        let addresses = "";
        for (const cont of request.contracts) {
          addresses += `${cont.contractName}, `;
        }

        console.log(`Error in ${this.pluginName}: ${NO_NEW_CONTRACTS_VERIFIED_ERR_MSG}`, addresses);
        return;
      }

      console.group();
      for (const contract of responseData.contracts) {
        console.log(`Contract at ${contract.address} verified.`);
      }
      console.groupEnd();
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${API_VERIFICATION_REQUEST_ERR_MSG}`);
    }
  }

  public async createVNet(
    accountSlug: string,
    projectSlug: string,
    networkId: string,
    blockNumber: string,
    chainConfig?: Record<string, string>
  ): Promise<VirtualNetwork | null> {
    if (!TenderlyApiService.isAuthenticated()) {
      console.log(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return null;
    }

    const tenderlyApi = TenderlyApiService.configureInstance();
    try {
      const res = await tenderlyApi.post(`/api/v1/account/${accountSlug}/project/${projectSlug}/fork`, {
        network_id: networkId,
        block_number: blockNumber === "latest" ? null : Number(blockNumber),
        chain_config: chainConfig,
        vnet: true,
      });

      return {
        vnet_id: res.data.simulation_fork.id,
        root_tx_id: res.data.root_transaction.id,
        chain_config: res.data.simulation_fork.chain_config,
      };
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${VNET_CREATION_FAILED_ERR_MSG}`);
    }
    return null;
  }

  public async getTransaction(
    accountSlug: string,
    projectSlug: string,
    forkId: string,
    transactionId: string
  ): Promise<Transaction | null> {
    if (!TenderlyApiService.isAuthenticated()) {
      console.log(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return null;
    }

    const tenderlyApi = TenderlyApiService.configureInstance();
    try {
      const res = await tenderlyApi.get(
        `/api/v1/account/${accountSlug}/project/${projectSlug}/fork/${forkId}/transaction/${transactionId}`
      );
      return res.data.fork_transaction;
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${TRANSACTION_FETCH_FAILED_ERR_MSG}`);
    }
    return null;
  }

  public async getPrincipal(): Promise<Principal | null> {
    if (!TenderlyApiService.isAuthenticated()) {
      console.log(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return null;
    }

    const tenderlyApi = TenderlyApiService.configureInstance();
    try {
      const res = await tenderlyApi.get("/api/v1/user");
      return {
        id: res.data.user.id,
        username: res.data.user.username,
      };
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${PRINCIPAL_FETCH_FAILED_ERR_MSG}`);
    }
    return null;
  }

  public async getProjectSlugs(principalId: string): Promise<Project[]> {
    if (!TenderlyApiService.isAuthenticated()) {
      console.log(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return [];
    }

    const tenderlyApi = TenderlyApiService.configureInstance();
    try {
      const res = await tenderlyApi.get(`/api/v1/account/${principalId}/projects`);
      return res.data.projects;
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${PROJECTS_FETCH_FAILED_ERR_MSG}`);
    }
    return [];
  }
}
