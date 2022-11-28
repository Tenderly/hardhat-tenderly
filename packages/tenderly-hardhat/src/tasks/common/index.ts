import { HardhatPluginError } from "hardhat/plugins";
import { RunTaskFunction, HardhatConfig } from "hardhat/types";
import { TenderlyContract } from "tenderly/types";
import { NETWORK_NAME_CHAIN_ID_MAP } from "tenderly/common/constants";

import { logger } from "../../utils/logger";
import { PLUGIN_NAME } from "../../constants";
import { Metadata } from "../../tenderly/types";
import { CONTRACTS_NOT_DETECTED } from "../../tenderly/errors";
import { extractCompilerVersion, resolveDependencies } from "../../utils/util";

export async function extractContractData(
  contracts: string[],
  network: string | undefined,
  config: HardhatConfig,
  run: RunTaskFunction
): Promise<TenderlyContract[]> {
  logger.info("Extracing contract data...");

  let contract: string;
  const requestContracts: TenderlyContract[] = [];

  const sourcePaths = await run("compile:solidity:get-source-paths");
  const sourceNames = await run("compile:solidity:get-source-names", {
    sourcePaths,
  });
  const data = await run("compile:solidity:get-dependency-graph", {
    sourceNames,
  });
  if (data.length === 0) {
    throw new HardhatPluginError(PLUGIN_NAME, CONTRACTS_NOT_DETECTED);
  }

  const metadata: Metadata = {
    defaultCompiler: {
      version: extractCompilerVersion(config),
    },
    sources: {},
  };

  data._resolvedFiles.forEach((resolvedFile: any, _: any) => {
    for (contract of contracts) {
      const contractData = contract.split("=");
      if (contractData.length < 2) {
        throw new HardhatPluginError(PLUGIN_NAME, `Invalid contract provided`);
      }

      if (network === undefined) {
        throw new HardhatPluginError(PLUGIN_NAME, `No network provided`);
      }
      const sourcePath: string = resolvedFile.sourceName;
      const name = sourcePath.split("/").slice(-1)[0].split(".")[0];

      if (name !== contractData[0]) {
        continue;
      }
      metadata.sources[sourcePath] = {
        content: resolvedFile.content.rawContent,
        versionPragma: resolvedFile.content.versionPragmas[0],
      };
      const visited: Record<string, boolean> = {};
      resolveDependencies(data, sourcePath, metadata, visited);
    }
  });

  for (const [key, value] of Object.entries(metadata.sources)) {
    const name = key.split("/").slice(-1)[0].split(".")[0];

    logger.trace("Currently processing contract:", name);
    const contractToPush: TenderlyContract = {
      contractName: name,
      source: value.content,
      sourcePath: key,
      networks: {},
      compiler: {
        name: "solc",
        version: extractCompilerVersion(config, key, value.versionPragma),
      },
    };

    for (contract of contracts) {
      const contractData = contract.split("=");
      if (contractToPush.contractName === contractData[0]) {
        let chainID: string = NETWORK_NAME_CHAIN_ID_MAP[network!.toLowerCase()];
        if (config.networks[network!].chainId !== undefined) {
          chainID = config.networks[network!].chainId!.toString();
        }
        if (chainID === undefined) {
          logger.error(
            `Error in ${PLUGIN_NAME}: Couldn't identify network. Please provide a chainID in the network config object`
          );
          return [];
        }
        contractToPush.networks = {
          [chainID]: {
            address: contractData[1],
          },
        };
      }
    }
    logger.silly(`Processed contract ${name}:`, contractToPush);

    requestContracts.push(contractToPush);
  }
  return requestContracts;
}
