import { HardhatPluginError } from "hardhat/plugins";
import { HardhatConfig } from "hardhat/src/types/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { PluginName } from "../constants";
import {
  ContractByName,
  Metadata,
  TenderlyContract,
  TenderlyContractConfig
} from "../tenderly/types";

export const getCompilerDataFromContracts = (
  contracts: TenderlyContract[],
  flatContracts: ContractByName[],
  hhConfig: HardhatConfig
): TenderlyContractConfig | undefined => {
  let contract: TenderlyContract;
  let mainContract: ContractByName;
  let config: TenderlyContractConfig | undefined;
  for (contract of contracts) {
    for (mainContract of flatContracts) {
      if (mainContract.name !== contract.contractName) {
        continue;
      }
      const contractConfig = newCompilerConfig(hhConfig, contract.sourcePath);
      if (config && !compareConfigs(contractConfig, config)) {
        console.log(
          `Error in ${PluginName}: Different compiler versions provided in same request`
        );
        throw new Error("Compiler version mismatch");
      } else {
        config = contractConfig;
      }
    }
  }
  return config;
};

export const getContracts = async (
  hre: HardhatRuntimeEnvironment,
  flatContracts: ContractByName[]
): Promise<TenderlyContract[]> => {
  const sourcePaths = await hre.run("compile:solidity:get-source-paths");
  const sourceNames = await hre.run("compile:solidity:get-source-names", {
    sourcePaths
  });
  const data = await hre.run("compile:solidity:get-dependency-graph", {
    sourceNames
  });
  if (data.length === 0) {
    throw new HardhatPluginError(
      PluginName,
      "Could not detect any contracts inside hardhat project. Make sure you have some contracts under ./contracts directory."
    );
  }

  let contract: ContractByName;
  const requestContracts: TenderlyContract[] = [];
  const metadata: Metadata = {
    compiler: {
      version: extractCompilerVersion(hre.config)
    },
    sources: {}
  };

  data._resolvedFiles.forEach((resolvedFile, _) => {
    const sourcePath: string = resolvedFile.sourceName;
    const name = sourcePath
      .split("/")
      .slice(-1)[0]
      .split(".")[0];

    for (contract of flatContracts) {
      if (contract.name !== name) {
        continue;
      }

      metadata.sources[sourcePath] = {
        content: resolvedFile.content.rawContent
      };
      const visited: Record<string, boolean> = {};
      resolveDependencies(data, sourcePath, metadata, visited);
    }
  });

  for (const [key, value] of Object.entries(metadata.sources)) {
    const name = key
      .split("/")
      .slice(-1)[0]
      .split(".")[0];
    const contractToPush: TenderlyContract = {
      contractName: name,
      source: value.content,
      sourcePath: key,
      networks: {},
      compiler: {
        name: "solc",
        version: extractCompilerVersion(hre.config, key)
      }
    };
    requestContracts.push(contractToPush);
  }
  return requestContracts;
};

export const resolveDependencies = (
  dependencyData: any,
  sourcePath: string,
  metadata: Metadata,
  visited: Record<string, boolean>
): void => {
  if (visited[sourcePath]) {
    return;
  }

  visited[sourcePath] = true;

  dependencyData._dependenciesPerFile
    .get(sourcePath)
    .forEach((resolvedDependency, __) => {
      resolveDependencies(
        dependencyData,
        resolvedDependency.sourceName,
        metadata,
        visited
      );
      metadata.sources[resolvedDependency.sourceName] = {
        content: resolvedDependency.content.rawContent
      };
    });
};

export const compareConfigs = (
  originalConfig: TenderlyContractConfig,
  newConfig: TenderlyContractConfig
): boolean => {
  if (originalConfig.compiler_version !== newConfig.compiler_version) {
    return false;
  }
  if (originalConfig.optimizations_used !== newConfig.optimizations_used) {
    return false;
  }
  if (originalConfig.optimizations_count !== newConfig.optimizations_count) {
    return false;
  }
  if (originalConfig.evm_version !== newConfig.evm_version) {
    return false;
  }
  return true;
};

export const newCompilerConfig = (
  config: HardhatConfig,
  sourcePath?: string
): TenderlyContractConfig => {
  if (
    sourcePath !== undefined &&
    config.solidity.overrides[sourcePath] !== undefined
  ) {
    return {
      compiler_version: config.solidity.overrides[sourcePath].version,
      optimizations_used:
        config.solidity.overrides[sourcePath].settings.optimizer.enabled,
      optimizations_count:
        config.solidity.overrides[sourcePath].settings.optimizer.runs,
      evm_version: config.solidity.overrides[sourcePath].settings.evmVersion,
      debug: config.solidity.overrides[sourcePath].settings.debug
    };
  }
  return {
    compiler_version: config.solidity.compilers[0].version,
    optimizations_used: config.solidity.compilers[0].settings.optimizer.enabled,
    optimizations_count: config.solidity.compilers[0].settings.optimizer.runs,
    evm_version: config.solidity.compilers[0].settings.evmVersion,
    debug: config.solidity.compilers[0].settings.debug
  };
};

export const extractCompilerVersion = (
  config: HardhatConfig,
  sourcePath?: string
): string => {
  if (
    sourcePath !== undefined &&
    config.solidity.overrides[sourcePath] !== undefined
  ) {
    return config.solidity.overrides[sourcePath].version;
  }
  return config.solidity.compilers[0].version;
};
