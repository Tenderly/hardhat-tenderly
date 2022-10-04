import "@nomiclabs/hardhat-ethers";
import "./type-extensions";
import "./tasks";

import { HardhatPluginError, lazyObject } from "hardhat/plugins";
import { extendConfig, extendEnvironment, task } from "hardhat/config";
import { RunTaskFunction, ActionType, HardhatConfig, HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyService } from "tenderly";
import { TenderlyContract } from "tenderly/types";
import { NETWORK_NAME_CHAIN_ID_MAP } from "tenderly/common/constants";
import { getAccessToken } from "tenderly/src/utils/config";

import { Tenderly } from "./Tenderly";
import { PLUGIN_NAME } from "./constants";
import { Metadata } from "./tenderly/types";
import { CONTRACTS_NOT_DETECTED } from "./tenderly/errors";
import { extendProvider, populateNetworks } from "./tenderly/extender";
import { extractCompilerVersion, newCompilerConfig, resolveDependencies } from "./utils/util";

const tenderlyService = new TenderlyService(PLUGIN_NAME);

extendEnvironment((env: HardhatRuntimeEnvironment) => {
  console.log("extendEnvironment");
  env.tenderly = lazyObject(() => new Tenderly(env));
  extendProvider(env);
  populateNetworks();
});

extendConfig((resolvedConfig: HardhatConfig) => {
  console.log("extendConfig");
  if (resolvedConfig.networks.tenderly === undefined) {
    resolvedConfig.networks.tenderly = {
      accounts: "remote",
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      httpHeaders: {
        "X-ACCESS-KEY": getAccessToken(),
      },
      timeout: 20000,
      url: process.env.VNET_URL ?? "",
    };
  }
});

interface VerifyArguments {
  contracts: string[];
}

const extractContractData = async (
  contracts: string[],
  network: string | undefined,
  config: HardhatConfig,
  run: RunTaskFunction
): Promise<TenderlyContract[]> => {
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
          console.log(
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
    requestContracts.push(contractToPush);
  }
  return requestContracts;
};

const verifyContract: ActionType<VerifyArguments> = async ({ contracts }, { config, hardhatArguments, run }) => {
  if (contracts === undefined) {
    throw new HardhatPluginError(
      PLUGIN_NAME,
      `At least one contract must be provided (ContractName=Address). Run --help for information.`
    );
  }

  const requestContracts = await extractContractData(contracts, hardhatArguments.network, config, run);

  await tenderlyService.verifyContracts({
    config: newCompilerConfig(config),
    contracts: requestContracts,
  });
};

const pushContracts: ActionType<VerifyArguments> = async ({ contracts }, { config, hardhatArguments, run }) => {
  if (contracts === undefined) {
    throw new HardhatPluginError(PLUGIN_NAME, `At least one contract must be provided (ContractName=Address)`);
  }

  if (config.tenderly.project === undefined) {
    throw new HardhatPluginError(
      PLUGIN_NAME,
      `Please provide the project field in the tenderly object in hardhat.config.js`
    );
  }

  if (config.tenderly.username === undefined) {
    throw new HardhatPluginError(
      PLUGIN_NAME,
      `Please provide the username field in the tenderly object in hardhat.config.js`
    );
  }

  const requestContracts = await extractContractData(contracts, hardhatArguments.network, config, run);
  const solcConfig = newCompilerConfig(config);

  await tenderlyService.pushContracts(
    {
      config: solcConfig,
      contracts: requestContracts,
    },
    config.tenderly.project,
    config.tenderly.username
  );
};

task("tenderly:verify", "Verifies contracts on Tenderly")
  .addOptionalVariadicPositionalParam(
    "contracts",
    "Addresses and names of contracts that will be verified formatted ContractName=Address"
  )
  .setAction(verifyContract);

task("tenderly:push", "Privately pushes contracts to Tenderly")
  .addOptionalVariadicPositionalParam(
    "contracts",
    "Addresses and names of contracts that will be verified formatted ContractName=Address"
  )
  .setAction(pushContracts);
