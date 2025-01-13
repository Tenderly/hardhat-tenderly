import { TENDERLY_DASHBOARD_BASE_URL } from "../../../common/constants";
import { configFilePath } from "../../../utils/config";
import { HardhatError } from "hardhat/internal/core/errors";

export const NETWORK_FETCH_FAILED_ERR_MSG = `There was an error during the request. Network fetch failed.`;
export const LATEST_BLOCK_NUMBER_FETCH_FAILED_ERR_MSG = `There was an error during the request. Latest block number fetch failed.`;
export const PRINCIPAL_FETCH_FAILED_ERR_MSG = `There was an error during the request. Principal fetch failed.`;
export const PROJECTS_FETCH_FAILED_ERR_MSG = `There was an error during the request. Projects fetch failed.`;

export const BYTECODE_MISMATCH_ERR_MSG = `Contract verification failed, bytecode mismatch detected. This can occur if compiler details or source is different compared to the deployed contract.`;
export const NO_VERIFIABLE_CONTRACTS_ERR_MSG = `Contracts are not eligible for verification.`;
export const NO_PROVIDED_CONTRACTS_ERR_MSG = `There are no provided contracts.`;
export const NO_NEW_CONTRACTS_VERIFIED_ERR_MSG = `Warning: No new contracts have been verified. \n  Contract not eligible for verification %s`;
export const NO_COMPILER_FOUND_FOR_CONTRACT_ERR_MSG = `No compiler configuration found for the contracts`;
export const API_VERIFICATION_REQUEST_ERR_MSG = `Verification failed. There was an error during the API request, please contact support with the above error.`;
export const API_ADD_CONTRACT_REQUEST_ERR_MSG = `Adding contract failed. There was an error during the API request, please contact support with the above error.`;
export const ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG = `Access token not provided at filepath ${configFilePath}.\n You can find the token at ${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`;

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized. Please visit https://docs.tenderly.co/virtual-testnets/smart-contract-frameworks/hardhat#install-tenderly-cli in order to login and get your access token.");
  }
}

export class InvalidResponseError extends Error {
  constructor(requestName: string, responseData: any) {
    super(`Invalid response for request: ${requestName}. Response data: ${JSON.stringify(responseData)}`);
  }
}

export class BytecodeMissingMethodSignaturesError extends Error {
  constructor(bytecodeMissingMethodSignatureError: any) {
    super(`There has been a bytecode missing method signature signature error during VerifyContractABI request: ${bytecodeMissingMethodSignatureError}`);
  }
}
