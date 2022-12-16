import { HardhatPluginError } from "hardhat/plugins";
import { HardhatConfig } from "hardhat/src/types/config";
import {
  Artifact,
  CompilationJob,
  DependencyGraph,
  HardhatRuntimeEnvironment,
  ResolvedFile,
  SolcConfig
} from "hardhat/types";
import { TenderlyContract, TenderlyContractConfig } from "tenderly/types";

import { PLUGIN_NAME } from "../constants";
import { CONTRACTS_NOT_DETECTED } from "../tenderly/errors";
import { ContractByName, Metadata } from "../tenderly/types";
import { logger } from "./logger";

export const getCompilerDataFromContracts = (
  contracts: TenderlyContract[],
  flatContracts: ContractByName[],
  hhConfig: HardhatConfig
): TenderlyContractConfig | undefined => {
  logger.debug("Obtaining compiler data from contracts.");

  let contract: TenderlyContract;
  let mainContract: ContractByName;
  let config: TenderlyContractConfig | undefined;
  for (contract of contracts) {
    for (mainContract of flatContracts) {
      if (mainContract.name !== contract.contractName) {
        continue;
      }
      logger.trace("Obtaining compiler data from contract:", mainContract.name);

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
  logger.debug("Processing contracts from the artifacts/ directory.");

  const sourcePaths = await hre.run("compile:solidity:get-source-paths");
  const sourceNames = await hre.run("compile:solidity:get-source-names", {
    sourcePaths,
  });
  const data: DependencyGraph = await hre.run("compile:solidity:get-dependency-graph", {
    sourceNames,
  });
  if (data.getResolvedFiles().length === 0) {
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

  for (const resolvedFile of data.getResolvedFiles()) {
     for (contract of flatContracts) {
      const artifact: Artifact = hre.artifacts.readArtifactSync(contract.name);
      
      if (artifact.sourceName !== resolvedFile.sourceName) {
        continue;
      }
      
      logger.trace("Found contract:", contract.name);

      metadata.sources[artifact.sourceName] = {
        contractName: artifact.contractName,
        content: resolvedFile.content.rawContent,
        versionPragma: resolvedFile.content.versionPragmas[0],
      };

      const visited: Record<string, boolean> = {};
      await resolveDependenciesTemp(hre, data, resolvedFile, metadata, visited);
      logger.info("Metadata:", metadata);
    }   
  }

  for (const [sourcePath, source] of Object.entries(metadata.sources)) {
    const contractToPush: TenderlyContract = {
      contractName: source.contractName!,
      source: source.content,
      sourcePath: sourcePath,
      networks: {},
      compiler: {
        name: "solc",
        version: extractCompilerVersion(hre.config, sourcePath, source.versionPragma),
      },
    };
    requestContracts.push(contractToPush);
  }

  logger.silly("Finished processing contracts from the artifacts/ folder:", requestContracts);

  return requestContracts;
};

// TODO(dusan) Because of TIC-87, there was a need to verify contracts that whether they are provided with
// short name parameter e.g. "Token" or with full name parameter e.g. "contracts/Token.sol:Token".
// For the reasons explained in that ticket, I made a temp resolvedDependencies function which should be removed 
// during the next iteration of the plugin.
export const resolveDependenciesTemp = async (
  hre: HardhatRuntimeEnvironment,
  dependencyGraph: DependencyGraph,
  file: ResolvedFile,
  metadata: Metadata,
  visited: Record<string, boolean>
): Promise<void> => {
  const fullyQualifiedNames = await hre.artifacts.getAllFullyQualifiedNames();
  logger.info("Fully qualified names:", fullyQualifiedNames);
  for (const dependencyFile of dependencyGraph.getDependencies(file)) {
    logger.info("Dependency file:", dependencyFile.sourceName);
    for (const contractName of fullyQualifiedNames) {
      const artifact: Artifact = hre.artifacts.readArtifactSync(contractName);
      logger.info("Artifact:", artifact.sourceName);
      if (visited[contractName] || artifact.sourceName !== dependencyFile.sourceName) {
        continue;
      }
      logger.info("Artifact passed:", contractName);
      visited[contractName] = true;
      metadata.sources[artifact.sourceName] = {
        contractName: artifact.contractName,
        content: dependencyFile.content.rawContent,
        versionPragma: dependencyFile.content.versionPragmas[0],
      };
      await resolveDependenciesTemp(hre, dependencyGraph, dependencyFile, metadata, visited);
    }
  }
}

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

export const getCompilerDataFromHardhat = async (
  hre: HardhatRuntimeEnvironment,
  sourceName: string,
): Promise<TenderlyContractConfig> => {
  const dependencyGraph: DependencyGraph = await _getDependencyGraph(hre);
  const file = dependencyGraph.getResolvedFiles().find((resolvedFile) => {
    return resolvedFile.sourceName === sourceName;
  });
  const job: CompilationJob = await hre.run("compile:solidity:get-compilation-job-for-file", {
    dependencyGraph,
    file
  });

  const hhConfig: SolcConfig = job.getSolcConfig();

  const tenderlyConfig: TenderlyContractConfig = {
    compiler_version: hhConfig?.version,
    optimizations_used: hhConfig?.settings?.optimizer?.enabled,
    optimizations_count: hhConfig?.settings?.optimizer?.runs,
    evm_version: hhConfig?.settings?.evmVersion,
  }
  if (hhConfig?.settings?.debug?.revertStrings) {
    tenderlyConfig.debug = {
      revertStrings: hhConfig.settings.debug.revertStrings
    }
  }

  return tenderlyConfig;
}

async function _getDependencyGraph(hre: HardhatRuntimeEnvironment): Promise<DependencyGraph> {
  const sourcePaths = await hre.run("compile:solidity:get-source-paths");
  const sourceNames: string[] = await hre.run("compile:solidity:get-source-names", {
    sourcePaths,
  });
  return hre.run("compile:solidity:get-dependency-graph", {
    sourceNames,
  });
}

export const newCompilerConfig = (
  config: HardhatConfig,
  sourcePath?: string,
  contractCompiler?: string
): TenderlyContractConfig => {
  if (sourcePath !== undefined && config.solidity.overrides[sourcePath] !== undefined) {
    logger.trace("There is a compiler config override for:", sourcePath);

    return {
      compiler_version: config.solidity.overrides[sourcePath].version,
      optimizations_used: config.solidity.overrides[sourcePath].settings.optimizer.enabled,
      optimizations_count: config.solidity.overrides[sourcePath].settings.optimizer.runs,
      evm_version: config.solidity.overrides[sourcePath].settings.evmVersion,
      debug: config.solidity.overrides[sourcePath].settings.debug,
    };
  }

  if (contractCompiler !== undefined) {
    logger.trace("There is a provided compiler configuration, determining it.");
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
