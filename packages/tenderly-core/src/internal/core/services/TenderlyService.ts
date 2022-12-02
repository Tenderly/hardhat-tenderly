import { TENDERLY_DASHBOARD_BASE_URL } from "../../../common/constants";
import { logApiError, logVerificationResult } from "../common/logger";
import {
  API_VERIFICATION_REQUEST_ERR_MSG,
  BYTECODE_MISMATCH_ERR_MSG,
  NO_NEW_CONTRACTS_VERIFIED_ERR_MSG,
  NO_VERIFIABLE_CONTRACTS_ERR_MSG,
  NETWORK_FETCH_FAILED_ERR_MSG,
  LATEST_BLOCK_NUMBER_FETCH_FAILED_ERR_MSG,
  ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG,
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
  TenderlyVerifyContractsRequest,
  VerifyContractsResponse,
} from "../types";
import { logger } from "../../../utils/logger";
import { TenderlyApiService } from "./TenderlyApiService";

export class TenderlyService {
  private pluginName: string;

  constructor(pluginName: string) {
    this.pluginName = pluginName;
  }

  public async getNetworks(): Promise<TenderlyNetwork[]> {
    logger.debug("Getting networks has been called.");

    let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
    if (TenderlyApiService.isAuthenticated()) {
      logger.debug("API service has been authenticated. Configuring instance...");
      tenderlyApi = TenderlyApiService.configureInstance();
      logger.debug("Instance has been configured.");
    }

    try {
      logger.debug("Making a call to get all of the public networks...");
      const res = await tenderlyApi.get("/api/v1/public-networks");
      logger.silly("Obtained public networks:", res.data);

      return res.data;
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${NETWORK_FETCH_FAILED_ERR_MSG}`);
    }
    return [];
  }

  public async getLatestBlockNumber(networkId: string): Promise<string | null> {
    logger.debug("Getting latest block number...");

    let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
    if (TenderlyApiService.isAuthenticated()) {
      tenderlyApi = TenderlyApiService.configureInstance();
    }

    try {
      logger.trace("Making a call to the api...");
      const res = await tenderlyApi.get(`/api/v1/network/${networkId}/block-number`);
      logger.trace(`Api successfully returned: ${res.data.block_number}`);

      return res.data.block_number;
    } catch (err) {
      logApiError(err);
      logger.error(`Error in ${this.pluginName}: ${LATEST_BLOCK_NUMBER_FETCH_FAILED_ERR_MSG}`);
    }
    return null;
  }

  public async verifyContracts(request: TenderlyVerifyContractsRequest): Promise<void> {
    logger.info("Verifying contracts has been called.");

    let tenderlyApi = TenderlyApiService.configureAnonymousInstance();
    if (TenderlyApiService.isAuthenticated()) {
      tenderlyApi = TenderlyApiService.configureInstance();
    }

    try {
      if (request.contracts.length === 0) {
        logger.error(NO_VERIFIABLE_CONTRACTS_ERR_MSG);
        return;
      }

      logger.debug("Making a call to the api...");
      const res = await tenderlyApi.post("/api/v1/public/contracts/verify", request);
      logger.debug("API call successfully made.");
      logger.trace("Retrieved data:", res.data);

      const responseData: VerifyContractsResponse = res.data;
      if (responseData.compilation_errors?.length > 0) {
        logger.error(
          "There has been a compilation error during public contract verification. Error data is:",
          responseData.compilation_errors
        );
        return;
      }

      for (const verificationResult of responseData.results) {
        logVerificationResult(verificationResult);
      }
    } catch (err) {
      logApiError(err);
      logger.error(`Error in ${this.pluginName}: ${API_VERIFICATION_REQUEST_ERR_MSG}`);
    }
  }

  public async pushContracts(
    request: TenderlyContractUploadRequest,
    tenderlyProject: string,
    username: string
  ): Promise<void> {
    if (!TenderlyApiService.isAuthenticated()) {
      logger.error(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return;
    }

    const tenderlyApi = TenderlyApiService.configureInstance();
    try {
      logger.debug("Making a call to the api...");
      const res = await tenderlyApi.post(`/api/v1/account/${username}/project/${tenderlyProject}/contracts`, {
        ...request,
      });
      logger.debug("Call to the api successfully made.");
      logger.trace("Retrieved data:", res.data);

      const responseData: ContractResponse = res.data;
      if (responseData.bytecode_mismatch_errors !== null) {
        logger.error(`Error in ${this.pluginName}: ${BYTECODE_MISMATCH_ERR_MSG}`);
        return;
      }

      if (responseData.contracts.length === 0) {
        let addresses = "";
        for (const cont of request.contracts) {
          addresses += `${cont.contractName}, `;
        }

        logger.error(`Error in ${this.pluginName}: ${NO_NEW_CONTRACTS_VERIFIED_ERR_MSG}`, addresses);
        return;
      }

      const dashLink = `${TENDERLY_DASHBOARD_BASE_URL}/${username}/${tenderlyProject}/contracts`;
      console.log(
        `Successfully privately verified Smart Contracts for project ${tenderlyProject}. You can view your contracts at ${dashLink}`
      );
    } catch (err) {
      logApiError(err);
      logger.error(`Error in ${this.pluginName}: ${API_VERIFICATION_REQUEST_ERR_MSG}`);
    }
  }

  public async verifyForkContracts(
    request: TenderlyForkContractUploadRequest,
    tenderlyProject: string,
    username: string,
    fork: string
  ): Promise<void> {
    logger.info("Fork verification has been called.");

    if (!TenderlyApiService.isAuthenticated()) {
      logger.error(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return;
    }

    const tenderlyApi = TenderlyApiService.configureTenderlyRPCInstance();
    try {
      logger.debug("Making a call to the api...");
      const res = await tenderlyApi.post(`/account/${username}/project/${tenderlyProject}/fork/${fork}/verify`, {
        ...request,
      });
      logger.debug("Call to the api successfully made.");
      logger.trace("Retrieved data:", res.data);

      const responseData: ContractResponse = res.data;
      if (responseData.bytecode_mismatch_errors !== null) {
        logger.error(BYTECODE_MISMATCH_ERR_MSG);
        return;
      }

      if (responseData.contracts.length === 0) {
        let addresses = "";
        for (const cont of request.contracts) {
          addresses += `${cont.contractName}, `;
        }

        logger.error(`Error in ${this.pluginName}: ${NO_NEW_CONTRACTS_VERIFIED_ERR_MSG}`, addresses);
        return;
      }

      console.group();
      for (const contract of responseData.contracts) {
        console.log(`Contract at ${contract.address} verified.`);
      }
      console.groupEnd();
    } catch (err) {
      logApiError(err);
      logger.error(`Error in ${this.pluginName}: ${API_VERIFICATION_REQUEST_ERR_MSG}`);
    }
  }

  public async getPrincipal(): Promise<Principal | null> {
    logger.debug("Getting principal has been called.");

    if (!TenderlyApiService.isAuthenticated()) {
      logger.error(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return null;
    }

    const tenderlyApi = TenderlyApiService.configureInstance();
    try {
      logger.debug("Making a call to the api...");
      const res = await tenderlyApi.get("/api/v1/user");
      logger.trace("Retrieved data:", { id: res.data.user.id, username: res.data.user.username });

      return {
        id: res.data.user.id,
        username: res.data.user.username,
      };
    } catch (err) {
      logApiError(err);
      logger.error(`Error in ${this.pluginName}: ${PRINCIPAL_FETCH_FAILED_ERR_MSG}`);
    }
    return null;
  }

  public async getProjectSlugs(principalId: string): Promise<Project[]> {
    logger.debug("Getting project slugs has been called.");

    if (!TenderlyApiService.isAuthenticated()) {
      logger.error(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return [];
    }

    const tenderlyApi = TenderlyApiService.configureInstance();
    try {
      logger.debug("Making a call to the api...");
      const res = await tenderlyApi.get(`/api/v1/account/${principalId}/projects`);
      logger.trace("Retrieved data:", res.data.projects);

      return res.data.projects;
    } catch (err) {
      logApiError(err);
      logger.error(`Error in ${this.pluginName}: ${PROJECTS_FETCH_FAILED_ERR_MSG}`);
    }
    return [];
  }
}
