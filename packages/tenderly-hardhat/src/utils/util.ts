import { HardhatPluginError } from "hardhat/plugins";
import { HardhatConfig, HttpNetworkConfig } from "hardhat/src/types/config";
import {
  Artifact,
  CompilationJob,
  DependencyGraph,
  HardhatRuntimeEnvironment,
  NetworkConfig,
  SolcConfig,
} from "hardhat/types";
import {
  TenderlyContract,
  TenderlyContractConfig,
  TenderlyVerificationContract,
  TenderlyVerifyContractsRequest,
  TenderlyVerifyContractsSource,
} from "tenderly/types";

import { NETWORK_NAME_CHAIN_ID_MAP } from "tenderly/common/constants";
import {
  TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
  TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH,
  TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
  TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS,
} from "hardhat/builtin-tasks/task-names";
import { Libraries } from "@nomicfoundation/hardhat-ethers/types";
import { CONTRACT_NAME_PLACEHOLDER, PLUGIN_NAME } from "../constants";
import { CONTRACTS_NOT_DETECTED } from "../tenderly/errors";
import { ContractByName, Metadata } from "../tenderly/types";
import { logger } from "./logger";

export const makeVerifyContractsRequest = async (
  hre: HardhatRuntimeEnvironment,
  flatContracts: ContractByName[],
  platformID?: string
): Promise<TenderlyVerifyContractsRequest | null> => {
  logger.info("Processing data needed for verification.");

  const contracts: TenderlyVerificationContract[] = [];
  for (const flatContract of flatContracts) {
    logger.info("Processing contract:", flatContract.name);

    let job: CompilationJob;
    try {
      job = await getCompilationJob(hre, flatContract.name);
    } catch (err) {
      // TODO(dusan): See how to wrap errors, don't return errors like this
      logger.error(
        `Error while trying to get compilation job for contract '${flatContract.name}'. The provided contract name probably doesn't exist or is mistyped.`
      );
      throw err;
    }

    const networkName = hre.hardhatArguments.network;
    if (networkName === undefined) {
      logger.error(
        `Error in ${PLUGIN_NAME}: Please provide a network via the hardhat --network argument or directly in the contract`
      );
      return null;
    }
    logger.trace("Found network is:", networkName);

    let chainId = undefined;
    if (isTenderlyNetworkConfig(hre.config.networks[networkName]) && platformID !== undefined) {
      chainId = platformID;
    } else if (hre.network?.config?.chainId !== undefined) {
      chainId = hre.network.config.chainId.toString();
    } else if (NETWORK_NAME_CHAIN_ID_MAP[networkName.toLowerCase()] !== undefined) {
      chainId = NETWORK_NAME_CHAIN_ID_MAP[networkName.toLowerCase()].toString();
    }
    logger.trace(`ChainId for network '${networkName}' is ${chainId}`);

    if (chainId === undefined) {
      logger.error(
        `Error in ${PLUGIN_NAME}: Couldn't identify network. Please provide a chainId in the network config object`
      );
      return null;
    }

    const compiler = await insertLibraries(hre, job.getSolcConfig(), flatContract.libraries);

    contracts.push({
      contractToVerify: flatContract.name,
      // TODO(dusan) this can be done with TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT hardhat task
      sources: await extractSources(hre, flatContract.name, job),
      compiler: await repackLibraries(compiler),
      networks: {
        [chainId]: {
          address: flatContract.address,
          links: flatContract.libraries,
        },
      },
    });
  }
  // TODO(dusan) see about merging compilation jobs?

  return {
    contracts,
  };
};

async function extractSources(
  hre: HardhatRuntimeEnvironment,
  contractToVerify: string,
  job: CompilationJob
): Promise<Record<string, TenderlyVerifyContractsSource>> {
  const sources: Record<string, TenderlyVerifyContractsSource> = {};
  logger.info("Extracting sources from compilation job.");

  const mainArtifact: Artifact = hre.artifacts.readArtifactSync(contractToVerify);
  for (const file of job.getResolvedFiles()) {
    let contractName = CONTRACT_NAME_PLACEHOLDER;
    // Only the contract to verify should have its name extracted since we need to attach a network to it.
    // Other names aren't important since they are only needed for compilation purposes.
    if (mainArtifact.sourceName === file.sourceName) {
      contractName = mainArtifact.contractName;
    }
    sources[file.sourceName] = {
      name: contractName,
      code: file.content.rawContent,
    };
  }

  return sources;
}

async function insertLibraries(
  hre: HardhatRuntimeEnvironment,
  originalCompiler: SolcConfig,
  libraries: Libraries | undefined
): Promise<SolcConfig> {
  // we need to copy the compiler in order to not modify the hardhat's compiler from the settings
  const copiedCompiler: SolcConfig = {
    version: originalCompiler.version,
    settings: {
      ...originalCompiler.settings
    }
  }
  if (libraries === undefined || libraries === null) {
    return copiedCompiler;
  }

  if (copiedCompiler.settings.libraries !== undefined && copiedCompiler.settings.libraries !== null) {
    throw new Error(
      `There are multiple definitions of libraries the contract should use. One is defined in the verify request and the other as an compiler config override. Please remove one of them.`
    );
  }

  copiedCompiler.settings.libraries = {};
  for (const [libName, libAddress] of Object.entries(libraries)) {
    const libArtifact: Artifact = hre.artifacts.readArtifactSync(libName);
    if (copiedCompiler.settings.libraries[libArtifact.sourceName] === undefined) {
      copiedCompiler.settings.libraries[libArtifact.sourceName] = {};
    }

    copiedCompiler.settings.libraries[libArtifact.sourceName][libName] = libAddress;
  }

  return copiedCompiler;
}

/* 
The only difference between SolcConfig and TenderlySolcConfig is in the settings.libraries object.

SolcConfig.settings.libraries is in the format of:
compiler.settings.libraries = {
  "contracts/path/Token.sol": {
    "contracts/library-path/Library.sol": "0x...."
  }
}

TenderlySolcConfig.settings.libraries is in the format of:
compiler.settings.libraries = {
  "contracts/path/Token.sol": {
    addresses: {
      "contracts/library-path/Library.sol": "0x...."
    }
  }
}

The reason for this are the definition limitations of proto messages.
Proto doesn't allow for a map to have a map as a value like map<string, map<string, string>>.
So we have to wrap the inner map in an object like map<string, Libraries> where Libraries is a message with a map<string, string> field.
*/
async function repackLibraries(compiler: SolcConfig): Promise<SolcConfig> {
  if (!compiler?.settings?.libraries) {
    return compiler;
  }
  const libraries: any = {};
  for (const [fileName, libVal] of Object.entries(compiler.settings.libraries)) {
    if (libraries[fileName] === undefined) {
      libraries[fileName] = { addresses: {} };
    }
    for (const [libName, libAddress] of Object.entries(libVal as any)) {
      libraries[fileName].addresses[libName] = libAddress;
    }
  }
  compiler.settings.libraries = libraries;

  return compiler;
}

export const getCompilationJob = async (
  hre: HardhatRuntimeEnvironment,
  contractName: string
): Promise<CompilationJob> => {
  logger.trace("Getting compilation job for contract:", contractName);

  const dependencyGraph: DependencyGraph = await getDependencyGraph(hre);

  const artifact = hre.artifacts.readArtifactSync(contractName);
  const file = dependencyGraph.getResolvedFiles().find((resolvedFile) => {
    return resolvedFile.sourceName === artifact.sourceName;
  });

  return hre.run(TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE, {
    dependencyGraph,
    file,
  });
};

async function getDependencyGraph(hre: HardhatRuntimeEnvironment): Promise<DependencyGraph> {
  const sourcePaths = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS);
  const sourceNames: string[] = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, {
    sourcePaths,
  });
  return hre.run(TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH, {
    sourceNames,
  });
}

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
    logger.trace("Processing file:", sourcePath);

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

// isTenderlyNetworkConfig checks if a network is available on tenderly by checking the rpc_url.
// This is done so the user can put custom network names in the hardhat config and still use them with tenderly.
// This is also done so the user can use multiple tenderly networks in their hardhat config file.
export const isTenderlyNetworkConfig = (nw: NetworkConfig): boolean => {
  if (nw === undefined || nw === null) {
    return false;
  }
  if (!isHttpNetworkConfig(nw)) {
    return false;
  }

  // The network is available on tenderly if the rpc_url contains `tenderly.co`
  const regex = /^.*tenderly\.co\/.*/;
  return regex.test(nw.url);
  // return name === "tenderly" || name === "devnet"
};

function isHttpNetworkConfig(config: NetworkConfig): config is HttpNetworkConfig {
  return (config as HttpNetworkConfig).url !== undefined;
}

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
