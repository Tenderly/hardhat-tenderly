import { HardhatPluginError } from "hardhat/plugins";
import { HardhatConfig } from "hardhat/src/types/config";
import { HardhatRuntimeEnvironment, SolcConfig } from "hardhat/types";

import { PluginName } from "../index";
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
      const contractConfig = newCompilerConfig(
        hhConfig,
        contract.sourcePath,
        contract.compiler?.version
      );
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
    defaultCompiler: {
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
        content: resolvedFile.content.rawContent,
        versionPragma: resolvedFile.content.versionPragmas[0]
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
        version: extractCompilerVersion(hre.config, key, value.versionPragma)
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
        content: resolvedDependency.content.rawContent,
        versionPragma: resolvedDependency.content.versionPragmas[0]
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
  sourcePath?: string,
  contractCompiler?: string
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
  if (contractCompiler !== undefined) {
    return determineCompilerConfig(config.solidity.compilers, contractCompiler);
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
  sourcePath?: string,
  versionPragma?: string
): string => {
  if (
    sourcePath !== undefined &&
    config.solidity.overrides[sourcePath] !== undefined
  ) {
    return config.solidity.overrides[sourcePath].version;
  }
  if (versionPragma !== undefined) {
    for (const compiler of config.solidity.compilers) {
      if (compareVersions(compiler.version, versionPragma)) {
        return compiler.version;
      }
    }
  }

  return config.solidity.compilers[0].version;
};

const determineCompilerConfig = (
  compilers: SolcConfig[],
  contractCompiler: string
): TenderlyContractConfig => {
  for (const compiler of compilers) {
    if (compareVersions(compiler.version, contractCompiler)) {
      return {
        compiler_version: compiler.version,
        optimizations_used: compiler.settings.optimizer.enabled,
        optimizations_count: compiler.settings.optimizer.runs,
        evm_version: compiler.settings.evmVersion,
        debug: compiler.settings.debug
      };
    }
  }

  return {
    compiler_version: compilers[0].version,
    optimizations_used: compilers[0].settings.optimizer.enabled,
    optimizations_count: compilers[0].settings.optimizer.runs,
    evm_version: compilers[0].settings.evmVersion,
    debug: compilers[0].settings.debug
  };
};

const compareVersions = (
  compilerVersion: string,
  contractVersionPragma: string
): boolean => {
  switch (contractVersionPragma[0]) {
    case "^":
      return checkGTEVersion(compilerVersion, contractVersionPragma.slice(1));
    case ">":
      if (contractVersionPragma.length === 6) {
        return checkGTVersion(compilerVersion, contractVersionPragma.slice(1));
      }
      if (contractVersionPragma.length === 7) {
        return checkGTEVersion(compilerVersion, contractVersionPragma.slice(2));
      }

      if (contractVersionPragma.length > 8) {
        const [gt, lt] = contractVersionPragma.split(" ");

        let isGT = false;
        let isLT = false;
        if (gt.length === 6) {
          isGT = checkGTVersion(compilerVersion, gt.slice(1));
        }
        if (gt.length === 7) {
          isGT = checkGTEVersion(compilerVersion, gt.slice(2));
        }

        if (lt.length === 6) {
          isLT = !checkGTEVersion(compilerVersion, lt.slice(1));
        }
        if (lt.length === 7) {
          isLT = !checkGTVersion(compilerVersion, lt.slice(2));
        }

        return isGT && isLT;
      }

      break;
    default:
      return checkGTEVersion(compilerVersion, contractVersionPragma);
  }

  return false;
};

const checkGTEVersion = (
  compilerVersion: string,
  contractVersionPragma: string
) => {
  const compilerVersionSplit = compilerVersion.split(".");
  const contractVersionSplit = contractVersionPragma.split(".");
  for (let i = 0; i < compilerVersionSplit.length; i++) {
    if (compilerVersionSplit[i] > contractVersionSplit[i]) {
      break;
    }
    if (compilerVersionSplit[i] < contractVersionSplit[i]) {
      return false;
    }
  }

  return true;
};

const checkGTVersion = (
  compilerVersion: string,
  contractVersionPragma: string
) => {
  const compilerVersionSplit = compilerVersion.split(".");
  const contractVersionSplit = contractVersionPragma.split(".");
  for (let i = 0; i < compilerVersionSplit.length; i++) {
    if (compilerVersionSplit[i] > contractVersionSplit[i]) {
      break;
    }
    if (compilerVersionSplit[i] <= contractVersionSplit[i]) {
      return false;
    }
  }

  return true;
};
