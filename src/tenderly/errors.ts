import { PluginName } from "../index";

export const BYTECODE_MISMATCH_ERROR = `Error in ${PluginName}: Contract verification failed, bytecode mismatch detected. This can occur if compiler details or source is different compared to the deployed contract.`;
export const NO_VERIFIABLE_CONTRACTS_ERROR = `${PluginName}: Contracts are not eligible for verification.`;
export const NO_NEW_CONTRACTS_VERIFIED_ERROR = `${PluginName}: No new contracts have been verified.`;
export const API_REQUEST_ERROR = `Error in ${PluginName}: Verification failed. There was an error during the API request, please contact support  with the above error.`;
export const CONTRACTS_NOT_DETECTED = `"Could not detect any contracts inside hardhat project. Make sure you have some contracts under ./contracts directory."`;
