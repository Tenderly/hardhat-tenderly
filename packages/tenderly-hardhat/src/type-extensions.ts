import "hardhat/types/config";
import "hardhat/types/runtime";

import {
  TenderlyContractUploadRequest,
  TenderlyForkContractUploadRequest,
  TenderlyVerifyContractsRequest,
} from "tenderly/types";

import { ContractByName, TenderlyConfig } from "./tenderly/types";
import { TenderlyNetwork } from "./TenderlyNetwork";

export interface TenderlyPlugin {
  /** *
   * @description
   * <p>Verify contracts on tenderly platform.</p>
   * <p>There are three ways to verify contracts on tenderly:<p>
   * <ul>
   *   <li><b>Private verification</b> - Set <i>privateVerification</i> flag in hardhat.config.ts as <i>true</i> and <i>--network</i> parameter must be anything but <i>tenderly</i></li>
   *   <li><b>Public verification</b> - Set <i>privateVerification</i> flag in hardhat.config.ts as <i>false</i> and <i>--network</i> parameter must be anything but <i>tenderly</i></li>
   *   <li><b>Fork verification</b> - The <i>--network</i> parameter must be set as <i>tenderly</i></li>
   * </ul>
   * <p>All of these verifications can happen implicitly without calling <code>tenderly.verify(...contracts)</code> method. This can be done by setting <i>automaticVerifications</i> flag to <i>true</i> in</p>
   * <p><code>tdly.setup({ automaticVerifications: true })</code></p>
   * <p><b>Note:</b> Public and private verification can be multi compiler verifications. Unfortunately, at this point in time, there is no multi compiler version of fork verification.</p>
   * @param contracts
   * <p>Variadic list of all contracts to be verified in format <code>{ name: "ContractName", address: "0x1234...." }</code>. You do not have to put contract's dependencies here, we extract them from the /artifacts directory.</p>
   * @example
   * tenderly.verify({
   *   name: "ContractName",
   *   address: "0x1234567890abcdef1234567890abcdef12345678",
   * }, {
   *   name: "AnotherContractName",
   *   address: "0xabc4567890abcdef1234567890abcdef12345678",
   * });
   */
  verify: (...contracts: ContractByName[]) => Promise<void>;

  /** *
   * @description
   * <p>Verify contracts on tenderly platform with a provided request.</p>
   * <p>This method only offers public and private verification. Unfortunately, at this point, there is no multi compiler version of fork verification.</p>
   * <ul>
   *   <li><b>Private verification</b> - Set <i>privateVerification</i> flag in hardhat.config.ts as <i>true</i> and <i>--network</i> parameter must be anything but <i>tenderly</i></li>
   *   <li><b>Public verification</b> - Set <i>privateVerification</i> flag in hardhat.config.ts as <i>false</i> and <i>--network</i> parameter must be anything but <i>tenderly</i></li>
   *   <li><b>Fork verification</b> - Not available</li>
   * </ul>
   * <p>This method can be used for single or multi compiler verification.</p>
   * <p><b>Note:</b> You are probably better off verifying via <code>tenderly.verify(...contracts)</code>.
   * If your contract has any dependencies, you must manually provide them their sources in the <code>sources</code> map inside a particular contract.</p>
   * @param request
   * <p>Request object that will be sent to the platform.</p>
   * <p>contractToVerify should have the name of the contract that you wish to verify. The name must belong to one of source names.</p>
   * <p>compiler complies with the structure of solidity compiler.
   * <p>In order to provide a network id as a key in the <i>networks</i> you can import the NETWORK_NAME_CHAIN_ID_MAP map as:</p>
   * <p><code>import { NETWORK_NAME_CHAIN_ID_MAP } from "tenderly/common/constants";</code></p>
   * <p>and then do</p>
   * <code>NETWORK_NAME_CHAIN_ID_MAP["sepolia"]</code>
   * @example
   * tenderly.verifyMultiCompilerAPI({
   *   "contracts": [
   *     {
   *       "contractToVerify": "contracts/interfaces/Token.sol:Token",
   *       "sources": {
   *         "path/to/contract": {
   *           "name": "Token",
   *           "code": "source code of the contract...",
   *         },
   *         "path/to/another/contract": {
   *           "name": "AnotherContract",
   *           "code": "source code of the contract..."
   *         }
   *       },
   *       "compiler": {
   *         "version": "0.8.17",
   *         "settings": {
   *           "optimizer": {
   *             "enabled": true,
   *             "runs": 200
   *           }
   *         }
   *       },
   *       "networks": {
   *         11155111: {
   *           "address": "0x1234567890123456789012345678901234567890"
   *         }
   *       }
   *     }
   *   ]
   * });
   */
  verifyMultiCompilerAPI: (request: TenderlyVerifyContractsRequest) => Promise<void>;

  /** *
   * @description
   * <p>Verify contracts on tenderly platform with a provided request.</p>
   * <p>This method only offers public verification. For private and fork verification via API, see pushAPI and verifyForkAPI respectively.</p>
   * <p><b>Note:</b> You are probably better off verifying via <code>tenderly.verify(...contracts)</code>.
   * If your contract has any dependencies, you must manually provide them as contracts in the <code>contracts</code> array.</p>
   * <p><b>Note:</b> The networks object should be provided only to the contracts that you wish to verify. The rest of the contracts should only be there as dependencies needed for compilation.</p>
   * <p><b>Note:</b> This method doesn't support multi compiler verification. You can check <code>tenderly.verifyMultiCompilerAPI(...)</code> for that.</p>
   * @param request
   * <p>Request object that will be sent to the platform.</p>
   * <p>In order to provide a network id as a key in the <i>networks</i> you can import the NETWORK_NAME_CHAIN_ID_MAP map as:</p>
   * <p><code>import { NETWORK_NAME_CHAIN_ID_MAP } from "tenderly/common/constants";</code></p>
   * <p>and then do</p>
   * <code>NETWORK_NAME_CHAIN_ID_MAP["sepolia"]</code>
   * @example
   * tenderly.verifyAPI({
   *   config: {
   *     compiler_version: "0.8.17",
   *     optimizations_used: true,
   *     optimizations_count: 200,
   *     evm_version: "default",
   *     debug: {
   *       revertStrings: "default"
   *     }
   *   },
   *   contracts: [
   *     {
   *       contractName: "Token",
   *       source: "source code of the Token contract that inherits Base...",
   *       sourcePath: "contracts/Token.sol",
   *       networks: {
   *         11155111: {
   *           address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
   *         }
   *       }
   *     }, {
   *      contractName: "BaseToken",
   *      source: "source code of the base token contract that Token inherits...",
   *      sourcePath: "contracts/BaseToken.sol",
   *    }
   *   ]
   * });
   */
  verifyAPI: (request: TenderlyContractUploadRequest) => Promise<void>;

  /** *
   * @description
   * <p>Verify deployed contracts on tenderly fork with a provided request.</p>
   * <p>This method only offers fork verification. For private and public verification via API, see pushAPI and verifyAPI respectively.</p>
   * <p><b>Note:</b> You are probably better off verifying via <code>tenderly.verify(...contracts)</code>.
   * If your contract has any dependencies, you must manually provide them as contracts in the <code>contracts</code> array.</p>
   * <p><b>Note:</b> The networks object should be provided only to the contracts that you wish to verify. The rest of the contracts should only be there as dependencies needed for compilation.</p>
   * <p><b>Note:</b> Unfortunately, at this point in time, there is no multi compiler version of the fork verification.</p>
   * @param request
   * <p>Request object that will be sent to the platform.</p>
   * <p>In order to provide a network id as a key in the <i>networks</i> you can import the NETWORK_NAME_CHAIN_ID_MAP map as:</p>
   * <p><code>import { NETWORK_NAME_CHAIN_ID_MAP } from "tenderly/common/constants";</code></p>
   * <p>and then do</p>
   * <code>NETWORK_NAME_CHAIN_ID_MAP["sepolia"]</code>
   * <p>Root parameter inside the request represents the transaction id from which the contract deployment will be searched.</p>
   * <p>This can be left undefined and the search will begin from the fork creation.</p>
   * <p>If you want to supply the root parameter, you can find the transaction id at the wanted simulation page as <i>Transaction Id</i>.</p>
   * @param tenderlyProject - Tenderly project name
   * @param username - Tenderly project username (or organization username)
   * @param forkID - Fork id on which verification is occurring
   * @example
   * tenderly.verifyForkAPI({
   *   config: {
   *     compiler_version: "0.8.17",
   *     optimizations_used: true,
   *     optimizations_count: 200,
   *     evm_version: "default",
   *     debug: {
   *       revertStrings: "default"
   *     }
   *   },
   *   contracts: [
   *     {
   *       contractName: "Token",
   *       source: "source code of the contract...",
   *       sourcePath: "contracts/Token.sol",
   *       networks: {
   *         11155111: {
   *           address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
   *         }
   *       }
   *     }, {
   *      contractName: "BaseToken",
   *      source: "source code of the base token contract that Token inherits...",
   *      sourcePath: "contracts/BaseToken.sol",
   *    }
   *   ],
   *   root: "f57549dd-7eaf-4d8e-ac59-c3e0c0d18636",
   * }, "project", "tenderly", "cd70178b-6377-404a-879a-25dcb5d51684");
   */
  /** *
   * @description Verifying deployed contracts on fork via API.
   * @param request - raw contract verification request param
   */
  verifyForkAPI: (
    request: TenderlyForkContractUploadRequest,
    tenderlyProject: string,
    username: string,
    forkID: string
  ) => Promise<void>;
  /** *
   * @description Persisting contract deployment data needed for verification purposes using hre.
   * @param contracts - List of contract names and addresses.s
   */
  persistArtifacts: (...contracts: ContractByName[]) => Promise<void>;

  /** *
   * @deprecated
   * @description
   * <p>Verify contracts on tenderly platform with a provided request.</p>
   * <p>This method only offers private verification. For public and fork verification via API, see verifyAPI and verifyForkAPI respectively.</p>
   * <p><b>Note:</b> You are probably better off verifying via <code>tenderly.verify(...contracts)</code>.
   * If your contract has any dependencies, you must manually provide them as contracts in the <code>contracts</code> array.</p>
   * <p><b>Note:</b> The networks object should be provided only to the contracts that you wish to verify. The rest of the contracts should only be there as dependencies needed for compilation.</p>
   * <p><b>Note:</b> This method doesn't support multi compiler verification. You can check <code>tenderly.verifyMultiCompilerAPI(...)</code> for that.</p>
   * @param request
   * <p>Request object that will be sent to the platform.</p>
   * <p>In order to provide a network id as a key in the <i>networks</i> you can import the network_name_to_id map as:</p>
   * <p><code>import { NETWORK_NAME_CHAIN_ID_MAP } from "tenderly/common/constants";</code></p>
   * <p>and then do</p>
   * <code>NETWORK_NAME_CHAIN_ID_MAP["rinkeby"]</code>
   * @param tenderlyProject - Tenderly project name
   * @param username - Tenderly project username (or organization username)
   * @example
   * tenderly.verifyAPI({
   *   config: {
   *     compiler_version: "0.8.17",
   *     optimizations_used: true,
   *     optimizations_count: 200,
   *     evm_version: "default",
   *     debug: {
   *       revertStrings: "default"
   *     }
   *   },
   *   contracts: [
   *     {
   *       contractName: "Token",
   *       source: "source code of the contract...",
   *       sourcePath: "contracts/Token.sol",
   *       networks: {
   *         5: {
   *           address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
   *         }
   *       }
   *     }
   *   ]
   * }, "project", "tenderly");
   */
  pushAPI: (request: TenderlyContractUploadRequest, tenderlyProject: string, username: string) => Promise<void>;
  /** *
   * @deprecated
   * @description
   * <p>Verify contracts on tenderly. This method relies on <code>tenderly.verify(...contracts)</code> in the background, so you can see that method.</p>
   */
  push: (...contracts: ContractByName[]) => Promise<void>;

  /** *
   * @deprecated
   */
  network: () => TenderlyNetwork;
  /** *
   * @deprecated
   */
  setNetwork: (network: TenderlyNetwork) => TenderlyNetwork;
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    tenderly: TenderlyPlugin;
    tenderlyNetwork: {
      send: (
        request: {
          method: string;
          params?: any[];
        },
        callback: (error: any, response: any) => void
      ) => void;
      verify: (...contracts: any[]) => Promise<void>;
      verifyAPI: (
        request: TenderlyForkContractUploadRequest,
        tenderlyProject: string,
        username: string,
        forkID: string
      ) => Promise<void>;
      resetFork: () => string | undefined;
      getHead: () => string | undefined;
      setHead: (head: string | undefined) => void;
      getFork: () => Promise<string | undefined>;
      setFork: (fork: string | undefined) => void;
      initializeFork: () => Promise<void>;
    };
  }
}

declare module "hardhat/types/config" {
  export interface HardhatUserConfig {
    tenderly?: TenderlyConfig;
  }

  export interface HardhatConfig {
    tenderly: TenderlyConfig;
  }
}
