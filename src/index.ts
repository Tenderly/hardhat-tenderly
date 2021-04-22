import { extendEnvironment, task } from "hardhat/config";
import { HardhatPluginError, lazyObject } from "hardhat/plugins";
import { RunTaskFunction } from "hardhat/src/types";
import {
  ActionType,
  HardhatConfig,
  HardhatRuntimeEnvironment
} from "hardhat/types";

import { Tenderly } from "./Tenderly";
import { TenderlyService } from "./tenderly/TenderlyService";
import { Metadata, TenderlyContract } from "./tenderly/types";
import { TenderlyPublicNetwork } from "./tenderly/types/Network";
import "./type-extensions";
import { resolveDependencies } from "./util";

export const PluginName = "hardhat-tenderly";

// TODO(Viktor): we can remove the maps once we figure out what to do with dashboard slugs and avalanche
export const NetworkMap: Record<string, string> = {
  kovan: "42",
  goerli: "5",
  mainnet: "1",
  rinkeby: "4",
  ropsten: "3",
  matic: "137",
  mumbai: "80001",
  xdai: "100",
  poa: "99",
  bsc: "56",
  "bsc-testnet": "97",
  rsk: "30",
  "rsk-testnet": "31",
  avalanche: "43114",
  "avalanche-testnet": "43113"
};

export const ReverseNetworkMap: Record<string, string> = {
  "42": "kovan",
  "5": "goerli",
  "1": "mainnet",
  "4": "rinkeby",
  "3": "ropsten",
  "80001": "matic-mumbai",
  "137": "matic-mainnet",
  "100": "xdai",
  "99": "poa",
  "56": "binance",
  "97": "rialto",
  "30": "rsk",
  "31": "rsk-testnet",
  "43114": "c-chain",
  "43113": "c-chain-testnet"
};

extendEnvironment(env => {
  env.tenderly = lazyObject(() => new Tenderly(env));
  populateNetworks(env);
});

const populateNetworks = (env: HardhatRuntimeEnvironment): void => {
  TenderlyService.getPublicNetworks()
    .then(networks => {
      let network: TenderlyPublicNetwork;
      let slug: string;
      for (network of networks) {
        NetworkMap[network.slug] = network.ethereum_network_id;
        NetworkMap[network.metadata.slug] = network.ethereum_network_id;

        ReverseNetworkMap[network.ethereum_network_id] = network.slug;

        for (slug of network.metadata.secondary_slugs) {
          NetworkMap[slug] = network.ethereum_network_id;
        }
      }
    })
    .catch(e => {
      console.log("Error encountered while fetching public networks");
    });
};

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
    sourcePaths
  });
  const data = await run("compile:solidity:get-dependency-graph", {
    sourceNames
  });

  const metadata: Metadata = {
    compiler: {
      version: config.solidity.compilers[0].version
    },
    sources: {}
  };

  data._resolvedFiles.forEach((resolvedFile, _) => {
    for (contract of contracts) {
      const contractData = contract.split("=");
      if (contractData.length < 2) {
        throw new HardhatPluginError(PluginName, `Invalid contract provided`);
      }

      if (network === undefined) {
        throw new HardhatPluginError(PluginName, `No network provided`);
      }
      const sourcePath: string = resolvedFile.sourceName;
      const name = sourcePath
        .split("/")
        .slice(-1)[0]
        .split(".")[0];

      if (name !== contractData[0]) {
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
        version: config.solidity.compilers[0].version
      }
    };

    for (contract of contracts) {
      const contractData = contract.split("=");
      if (contractToPush.contractName === contractData[0]) {
        let chainID: string = NetworkMap[network!.toLowerCase()];
        if (config.networks[network!].chainId !== undefined) {
          chainID = config.networks[network!].chainId!.toString();
        }
        if (chainID === undefined) {
          console.log(
            `Error in ${PluginName}: Couldn't identify network. Please provide a chainID in the network config object`
          );
          return [];
        }
        contractToPush.networks = {
          [chainID]: {
            address: contractData[1]
          }
        };
      }
    }
    requestContracts.push(contractToPush);
  }
  return requestContracts;
};

const verifyContract: ActionType<VerifyArguments> = async (
  { contracts },
  { config, hardhatArguments, run }
) => {
  if (contracts === undefined) {
    throw new HardhatPluginError(
      PluginName,
      `At least one contract must be provided (ContractName=Address)`
    );
  }

  const requestContracts = await extractContractData(
    contracts,
    hardhatArguments.network,
    config,
    run
  );
  const solcConfig = {
    compiler_version: config.solidity.compilers[0].version,
    optimizations_used: config.solidity.compilers[0].settings.optimizer.enabled,
    optimizations_count: config.solidity.compilers[0].settings.optimizer.runs
  };

  await TenderlyService.verifyContracts({
    config: solcConfig,
    contracts: requestContracts
  });
};

const pushContracts: ActionType<VerifyArguments> = async (
  { contracts },
  { config, hardhatArguments, run }
) => {
  if (contracts === undefined) {
    throw new HardhatPluginError(
      PluginName,
      `At least one contract must be provided (ContractName=Address)`
    );
  }

  if (config.tenderly.project === undefined) {
    throw new HardhatPluginError(
      PluginName,
      `Please provide the project field in the tenderly object in hardhat.config.js`
    );
  }

  if (config.tenderly.username === undefined) {
    throw new HardhatPluginError(
      PluginName,
      `Please provide the username field in the tenderly object in hardhat.config.js`
    );
  }

  const requestContracts = await extractContractData(
    contracts,
    hardhatArguments.network,
    config,
    run
  );
  const solcConfig = {
    compiler_version: config.solidity.compilers[0].version,
    optimizations_used: config.solidity.compilers[0].settings.optimizer.enabled,
    optimizations_count: config.solidity.compilers[0].settings.optimizer.runs
  };

  await TenderlyService.pushContracts(
    {
      config: solcConfig,
      contracts: requestContracts
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
