const Plugin = "hardhat-tenderly";

export const BYTECODE_MISMATCH_ERROR = `Error in ${Plugin}: Contract verification failed, bytecode mismatch detected. This can occur if compiler details or source is different compared to the deployed contract.`;
export const NO_VERIFIABLE_CONTRACTS_ERROR = `${Plugin}: Contracts are not eligible for verification.`;
export const NO_NEW_CONTRACTS_VERIFIED_ERROR = `${Plugin}: Warning: No new contracts have been verified. \n  Contract not eligible for verification %s`;
export const NO_COMPILER_FOUND_FOR_CONTRACT = `Error in ${Plugin}: No compiler configuration found for the contracts`;
export const API_REQUEST_ERROR = `Error in ${Plugin}: Verification failed. There was an error during the API request, please contact support with the above error.`;
export const CONTRACTS_NOT_DETECTED = `"Could not detect any contracts inside hardhat project. Make sure you have some contracts under ./contracts directory."`;
