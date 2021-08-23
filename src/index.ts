import "@nomiclabs/hardhat-ethers";
import { extendConfig, extendEnvironment, task } from "hardhat/config";
import { HardhatPluginError, lazyObject } from "hardhat/plugins";
import { RunTaskFunction } from "hardhat/src/types";
import {
  ActionType,
  HardhatConfig,
  HttpNetworkConfig,
  HardhatRuntimeEnvironment
} from "hardhat/types";

import { Tenderly } from "./Tenderly";
import { TENDERLY_RPC_BASE, TenderlyService } from "./tenderly/TenderlyService";
import { Metadata, TenderlyContract } from "./tenderly/types";
import { TenderlyPublicNetwork } from "./tenderly/types/Network";
import "./type-extensions";
import {extractCompilerVersion, newCompilerConfig, resolveDependencies} from "./util";
import {TenderlyNetwork} from "./TenderlyNetwork";

export const PluginName = "hardhat-tenderly";

extendEnvironment(env => {
  env.tenderly = lazyObject(() => new Tenderly(env));
  extendProvider(env);
});

extendConfig((resolvedConfig, userConfig) => {
  resolvedConfig.networks.tenderly = {
    ...resolvedConfig.networks.tenderly
  };
});

const extendProvider = (hre: HardhatRuntimeEnvironment): void => {
  if (hre.network.name !== "tenderly") {
    return;
  }
  if ("url" in hre.network.config && hre.network.config.url !== undefined) {
    const forkID = hre.network.config.url.split("/").pop();
    hre.tenderly.network().setFork(forkID);
    return;
  }

  let fork = new TenderlyNetwork(hre)
  fork.initializeFork()
    .then(_ => {
      hre.tenderly.setNetwork(fork);
      (hre.network.config as HttpNetworkConfig).url = TENDERLY_RPC_BASE + `/fork/${hre.tenderly.network().getFork()}`
      hre.ethers.provider = new hre.ethers.providers.Web3Provider(
          hre.tenderly.network()
      );
    })
    .catch(_ => {
      console.log(
        `Error in ${PluginName}: Initializing fork, check your tenderly configuration`
      );
    });
};

interface VerifyArguments {
  contracts: string[];
}

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
      version: extractCompilerVersion(config)
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
        version: extractCompilerVersion(config, key)
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

  await TenderlyService.verifyContracts({
    config: newCompilerConfig(config),
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
  const solcConfig = newCompilerConfig(config);

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
