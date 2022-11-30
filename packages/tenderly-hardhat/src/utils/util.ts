import { HardhatPluginError } from "hardhat/plugins";
import { HardhatConfig } from "hardhat/src/types/config";
import { HardhatRuntimeEnvironment, SolcConfig } from "hardhat/types";
import {
  TenderlyContract,
  TenderlyContractConfig,
  TenderlyVerificationContract,
  TenderlyVerifyContractsSource,
} from "tenderly/types";

import { CompilerConfiguration } from "tenderly/internal/core/types/Compiler";
import { PLUGIN_NAME } from "../constants";
import { CONTRACTS_NOT_DETECTED } from "../tenderly/errors";
import { ContractByName, Metadata } from "../tenderly/types";
import { logger } from "./logger";

export const fillCompilerConfigurationInContracts = async (
  hre: HardhatRuntimeEnvironment,
  contracts: TenderlyVerificationContract[]
): Promise<TenderlyVerificationContract[]> => {
  logger.debug("Filling compiler data in verification contracts...");
  const hhConfig: HardhatConfig = hre.config;

  for (const contract of contracts) {
    let contractCompilerConfig: TenderlyContractConfig | undefined;
    for (const [sourcePath, _] of Object.entries(contract.sources)) {
      const sourceCompilerConfig: TenderlyContractConfig = newCompilerConfig(
        hhConfig,
        sourcePath,
        extractCompilerVersion(hhConfig, sourcePath, await _getVersionPragma(hre, sourcePath))
      );
      if (
        contractCompilerConfig !== undefined &&
        contractCompilerConfig !== null &&
        !compareConfigs(sourceCompilerConfig, contractCompilerConfig)
      ) {
        logger.error(`Error in ${PLUGIN_NAME}: Different compiler versions provided in same request`);
        throw new Error("Compiler version mismatch");
      } else {
        contractCompilerConfig = sourceCompilerConfig;
      }
    }

    // converting to match api request format
    contract.compiler = _convertCompilerConfiguration(contractCompilerConfig!);

    logger.silly("Obtained compiler configuration is:", contract.compiler);
  }
  logger.debug("Compiler data has been obtained.");

  return contracts;
};

async function _getVersionPragma(hre: HardhatRuntimeEnvironment, sourcePath: string): Promise<string | undefined> {
  const sourcePaths = await hre.run("compile:solidity:get-source-paths");
  const sourceNames = await hre.run("compile:solidity:get-source-names", {
    sourcePaths,
  });
  const data = await hre.run("compile:solidity:get-dependency-graph", {
    sourceNames,
  });

  data._resolvedFiles.forEach((resolvedFile: any, _: any) => {
    if (resolvedFile.sourceName === sourcePath) {
      return resolvedFile.content.versionPragmas[0];
    }
  });

  return undefined;
}

function _convertCompilerConfiguration(config: TenderlyContractConfig): CompilerConfiguration {
  const convertedConfig: CompilerConfiguration = {};
  if (config?.compiler_version !== undefined) {
    convertedConfig.version = config.compiler_version;
  }
  if (config?.evm_version !== undefined) {
    if (convertedConfig?.settings === undefined) {
      convertedConfig.settings = {};
    }
    convertedConfig.settings.evmVersion = config.evm_version;
  }
  if (config?.optimizations_used !== undefined) {
    if (convertedConfig?.settings === undefined) {
      convertedConfig.settings = {};
    }
    convertedConfig.settings.optimizer = {
      runs: config.optimizations_count,
    };
  }
  if (config?.debug !== undefined && config.debug?.revertStrings !== undefined) {
    if (convertedConfig?.settings === undefined) {
      convertedConfig.settings = {};
    }
    convertedConfig.settings.debug = {
      revertString: config.debug?.revertStrings,
    };
  }
  return convertedConfig;
}

export const getCompilerDataFromContracts = (
  contracts: TenderlyContract[],
  flatContracts: ContractByName[],
  hhConfig: HardhatConfig
): TenderlyContractConfig | undefined => {
  logger.debug("Obtaining compiler data from contracts...");

  let contract: TenderlyContract;
  let mainContract: ContractByName;
  let config: TenderlyContractConfig | undefined;
  for (contract of contracts) {
    for (mainContract of flatContracts) {
      if (mainContract.name !== contract.contractName) {
        continue;
      }
      logger.trace("Currently obtaining compiler data from contract:", mainContract.name);

      const contractConfig = newCompilerConfig(hhConfig, contract.sourcePath, contract.compiler?.version);
      if (config !== null && config !== undefined && !compareConfigs(contractConfig, config)) {
        logger.error(`Error in ${PLUGIN_NAME}: Different compiler versions provided in same request`);
        throw new Error("Compiler version mismatch");
      } else {
        config = contractConfig;
      }
    }
  }
  logger.debug("Compiler data has been obtained.");
  logger.silly("Obtained compiler configuration is:", config);

  return config;
};

export const getContracts = async (
  hre: HardhatRuntimeEnvironment,
  flatContracts: ContractByName[]
): Promise<TenderlyContract[]> => {
  logger.debug("Processing contracts from the artifacts/ folder.");

  const sourcePaths = await hre.run("compile:solidity:get-source-paths");
  const sourceNames = await hre.run("compile:solidity:get-source-names", {
    sourcePaths,
  });
  const data = await hre.run("compile:solidity:get-dependency-graph", {
    sourceNames,
  });
  if (data.length === 0) {
    throw new HardhatPluginError(PLUGIN_NAME, CONTRACTS_NOT_DETECTED);
  }

  let contract: ContractByName;
  const requestContracts: TenderlyContract[] = [];
  const metadata: Metadata = {
    defaultCompiler: {
      version: extractCompilerVersion(hre.config),
    },
    sources: {},
  };
  logger.trace("Extracted compiler version is:", metadata.defaultCompiler.version);

  data._resolvedFiles.forEach((resolvedFile: any, _: any) => {
    const sourcePath: string = resolvedFile.sourceName;
    logger.trace("Currently processing file:", sourcePath);

    const name = sourcePath.split("/").slice(-1)[0].split(".")[0];
    logger.trace("Obtained name from source file:", name);

    for (contract of flatContracts) {
      if (contract.name !== name) {
        continue;
      }
      logger.trace("Found contract:", contract.name);

      metadata.sources[sourcePath] = {
        content: resolvedFile.content.rawContent,
        versionPragma: resolvedFile.content.versionPragmas[0],
      };

      if (
        metadata.sources[sourcePath].content === undefined ||
        metadata.sources[sourcePath].content === null ||
        metadata.sources[sourcePath].content === ""
      ) {
        logger.error("Metadata source content is empty!");
      }
      if (
        metadata.sources[sourcePath].versionPragma === undefined ||
        metadata.sources[sourcePath].versionPragma === null ||
        metadata.sources[sourcePath].versionPragma === ""
      ) {
        logger.error("Metadata source version pragma is empty!");
      }

      const visited: Record<string, boolean> = {};
      resolveDependencies(data, sourcePath, metadata, visited);
    }
  });

  for (const [key, value] of Object.entries(metadata.sources)) {
    const name = key.split("/").slice(-1)[0].split(".")[0];
    const contractToPush: TenderlyContract = {
      contractName: name,
      source: value.content,
      sourcePath: key,
      networks: {},
      compiler: {
        name: "solc",
        version: extractCompilerVersion(hre.config, key, value.versionPragma),
      },
    };
    requestContracts.push(contractToPush);
  }

  logger.silly("Finished processing contracts from the artifacts/ folder:", requestContracts);

  return requestContracts;
};

export const getVerificationContracts = async (
  hre: HardhatRuntimeEnvironment,
  flatContracts: ContractByName[]
): Promise<TenderlyVerificationContract[]> => {
  logger.debug("Processing contracts from the artifacts/ folder.");

  const sourcePaths = await hre.run("compile:solidity:get-source-paths");
  const sourceNames = await hre.run("compile:solidity:get-source-names", {
    sourcePaths,
  });
  const data = await hre.run("compile:solidity:get-dependency-graph", {
    sourceNames,
  });
  if (data.length === 0) {
    throw new HardhatPluginError(PLUGIN_NAME, CONTRACTS_NOT_DETECTED);
  }

  let contract: ContractByName;
  const requestContracts: TenderlyVerificationContract[] = [];

  data._resolvedFiles.forEach((resolvedFile: any, _: any) => {
    const sourcePath: string = resolvedFile.sourceName;
    const name = sourcePath.split("/").slice(-1)[0].split(".")[0];
    const sources: Record<string, TenderlyVerifyContractsSource> = {};

    for (contract of flatContracts) {
      if (contract.name !== name) {
        continue;
      }
      logger.trace("Currently processing:", {
        file: sourcePath,
        contractName: contract.name,
      });

      sources[sourcePath] = {
        name: contract.name,
        code: resolvedFile.content.rawContent,
      };

      if (
        sources[sourcePath].code === undefined ||
        sources[sourcePath].code === null ||
        sources[sourcePath].code === ""
      ) {
        logger.error("Metadata source content is empty!");
      }

      const visited: Record<string, boolean> = {};
      resolveDependenciesWithSources(data, sourcePath, sources, visited);

      const contractToPush: TenderlyVerificationContract = {
        contractToVerify: contract.name,
        sources,
      };
      requestContracts.push(contractToPush);
    }
  });

  logger.silly("Finished processing contracts from the artifacts/ folder:", requestContracts);

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

  dependencyData._dependenciesPerFile.get(sourcePath).forEach((resolvedDependency: any, _: any) => {
    resolveDependencies(dependencyData, resolvedDependency.sourceName, metadata, visited);
    metadata.sources[resolvedDependency.sourceName] = {
      content: resolvedDependency.content.rawContent,
      versionPragma: resolvedDependency.content.versionPragmas[0],
    };
  });
};

export const resolveDependenciesWithSources = (
  dependencyData: any,
  sourcePath: string,
  sources: Record<string, TenderlyVerifyContractsSource>,
  visited: Record<string, boolean>
): void => {
  if (visited[sourcePath]) {
    return;
  }

  visited[sourcePath] = true;

  dependencyData._dependenciesPerFile.get(sourcePath).forEach((resolvedDependency: any, _: any) => {
    resolveDependenciesWithSources(dependencyData, resolvedDependency.sourceName, sources, visited);

    const name = resolvedDependency.sourceName.split("/").slice(-1)[0].split(".")[0];
    sources[resolvedDependency.sourceName] = {
      name,
      code: resolvedDependency.content.rawContent,
    };
  });
};

export const compareConfigs = (originalConfig: TenderlyContractConfig, newConfig: TenderlyContractConfig): boolean => {
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
  if (sourcePath !== undefined && config.solidity.overrides[sourcePath] !== undefined) {
    logger.trace("There is an compiler config override for:", sourcePath);

    return {
      compiler_version: config.solidity.overrides[sourcePath].version,
      optimizations_used: config.solidity.overrides[sourcePath].settings.optimizer.enabled,
      optimizations_count: config.solidity.overrides[sourcePath].settings.optimizer.runs,
      evm_version: config.solidity.overrides[sourcePath].settings.evmVersion,
      debug: config.solidity.overrides[sourcePath].settings.debug,
    };
  }

  if (contractCompiler !== undefined) {
    logger.trace("There is a provided compiler configuration, determining it...");
    return determineCompilerConfig(config.solidity.compilers, contractCompiler);
  }

  logger.trace("Returning the first compiler in the configuration");

  return {
    compiler_version: config.solidity.compilers[0].version,
    optimizations_used: config.solidity.compilers[0].settings.optimizer.enabled,
    optimizations_count: config.solidity.compilers[0].settings.optimizer.runs,
    evm_version: config.solidity.compilers[0].settings.evmVersion,
    debug: config.solidity.compilers[0].settings.debug,
  };
};

export const extractCompilerVersion = (config: HardhatConfig, sourcePath?: string, versionPragma?: string): string => {
  if (sourcePath !== undefined && config.solidity.overrides[sourcePath] !== undefined) {
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

const determineCompilerConfig = (compilers: SolcConfig[], contractCompiler: string): TenderlyContractConfig => {
  for (const compiler of compilers) {
    if (compareVersions(compiler.version, contractCompiler)) {
      logger.trace("Provided compiler matched the version: ", compiler.version);

      return {
        compiler_version: compiler.version,
        optimizations_used: compiler.settings.optimizer.enabled,
        optimizations_count: compiler.settings.optimizer.runs,
        evm_version: compiler.settings.evmVersion,
        debug: compiler.settings.debug,
      };
    }
  }

  logger.trace(
    "Couldn't find the provided compiler among compilers in the configuration, returning the configuration of the first one"
  );

  return {
    compiler_version: compilers[0].version,
    optimizations_used: compilers[0].settings.optimizer.enabled,
    optimizations_count: compilers[0].settings.optimizer.runs,
    evm_version: compilers[0].settings.evmVersion,
    debug: compilers[0].settings.debug,
  };
};

const compareVersions = (compilerVersion: string, contractVersionPragma: string): boolean => {
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

const checkGTEVersion = (compilerVersion: string, contractVersionPragma: string) => {
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

const checkGTVersion = (compilerVersion: string, contractVersionPragma: string) => {
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

// ------------------------------------------------------------------------------------
const isGetter = (x: any, name: string): any => ((Object.getOwnPropertyDescriptor(x, name) !== null || {}) as any).get;
const isFunction = (x: any, name: string): boolean => typeof x[name] === "function";
const deepFunctions = (x: any): string[] => {
  if (x && x !== Object.prototype) {
    return Object.getOwnPropertyNames(x)
      .filter((name: string) => isGetter(x, name) !== null || isFunction(x, name))
      .concat(deepFunctions(Object.getPrototypeOf(x)) ?? []);
  }
  return [];
};
const distinctDeepFunctions = (x: any) => Array.from(new Set(deepFunctions(x)));
export const classFunctions = (x: any) =>
  distinctDeepFunctions(x).filter((name: string) => name !== "constructor" && name.indexOf("__") === -1);
