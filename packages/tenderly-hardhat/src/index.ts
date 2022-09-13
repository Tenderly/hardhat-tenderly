import "@nomiclabs/hardhat-ethers";
import "./type-extensions";

import { ethers } from "ethers";
import { HardhatPluginError, lazyObject } from "hardhat/plugins";
import { extendConfig, extendEnvironment, task } from "hardhat/config";
import {
  RunTaskFunction,
  ActionType,
  HardhatConfig,
  HardhatRuntimeEnvironment,
  HttpNetworkConfig,
} from "hardhat/types";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";
import { TenderlyService } from "tenderly";
import { TenderlyContract, TenderlyNetwork as TenderlyNetworkInterface } from "tenderly/types";
import {
  CHAIN_ID_NETWORK_NAME_MAP,
  NETWORK_NAME_CHAIN_ID_MAP,
  TENDERLY_JSON_RPC_BASE_URL,
} from "tenderly/common/constants";

import { Tenderly } from "./Tenderly";
import { PLUGIN_NAME } from "./constants";
import { TenderlyNetwork } from "./TenderlyNetwork";
import { Metadata } from "./tenderly/types";
import { wrapEthers } from "./tenderly/ethers";
import { CONTRACTS_NOT_DETECTED } from "./tenderly/errors";
import { wrapHHDeployments } from "./tenderly/hardhat-deploy";
import { extractCompilerVersion, newCompilerConfig, resolveDependencies } from "./utils/util";

extendEnvironment((env: HardhatRuntimeEnvironment) => {
  env.tenderly = lazyObject(() => new Tenderly(env));
  extendProvider(env);
  populateNetworks();
});

extendConfig((resolvedConfig) => {
  resolvedConfig.networks.tenderly = {
    ...resolvedConfig.networks.tenderly,
  };
});

export const setup = (cfg?: { automaticVerifications: boolean }): void => {
  let automatic = true;
  if (cfg !== undefined && cfg?.automaticVerifications !== undefined) {
    automatic = cfg.automaticVerifications;
  }

  extendEnvironment((env: HardhatRuntimeEnvironment) => {
    env.tenderly = lazyObject(() => new Tenderly(env));
    extendProvider(env);
    populateNetworks();
    if (automatic) {
      extendEthers(env);
      extendHardhatDeploy(env);
    }
  });
};

const extendEthers = (hre: HardhatRuntimeEnvironment): void => {
  if ("ethers" in hre && hre.ethers !== undefined && "tenderly" in hre && hre.tenderly !== undefined) {
    Object.assign(
      hre.ethers,
      wrapEthers(
        hre.ethers as unknown as typeof ethers & HardhatEthersHelpers,
        hre.tenderly
      ) as unknown as typeof hre.ethers
    );
  }
};

const extendHardhatDeploy = (hre: HardhatRuntimeEnvironment): void => {
  // ts-ignore is needed here because we want to avoid importing hardhat-deploy in order not to cause duplicated initialization of the .deployments field
  if (
    "deployments" in hre &&
    // @ts-ignore
    hre.deployments !== undefined &&
    "tenderly" in hre &&
    // @ts-ignore
    hre.tenderly !== undefined
  ) {
    // @ts-ignore
    hre.deployments = wrapHHDeployments(hre.deployments, hre.tenderly);
  }
};

const extendProvider = (hre: HardhatRuntimeEnvironment): void => {
  if (hre.network.name !== "tenderly") {
    return;
  }

  if ("url" in hre.network.config && hre.network.config.url !== undefined) {
    const forkID = hre.network.config.url.split("/").pop();
    hre.tenderly.network().setFork(forkID);
    return;
  }

  const tenderlyNetwork = new TenderlyNetwork(hre);
  tenderlyNetwork
    .initializeFork()
    .then(async (_) => {
      hre.tenderly.setNetwork(tenderlyNetwork);
      const forkID = await hre.tenderly.network().getForkID();
      (hre.network.config as HttpNetworkConfig).url = `${TENDERLY_JSON_RPC_BASE_URL}/fork/${forkID ?? ""}`;
      hre.ethers.provider = new hre.ethers.providers.Web3Provider(hre.tenderly.network());
    })
    .catch((_) => {
      console.log(`Error in ${PLUGIN_NAME}: Initializing fork, check your tenderly configuration`);
    });
};

interface VerifyArguments {
  contracts: string[];
}

const populateNetworks = (): void => {
  const tenderlyService = new TenderlyService(PLUGIN_NAME);
  tenderlyService
    .getNetworks()
    .then((networks: TenderlyNetworkInterface[]) => {
      let network: TenderlyNetworkInterface;
      let slug: string;
      for (network of networks) {
        NETWORK_NAME_CHAIN_ID_MAP[network.slug] = network.ethereum_network_id;

        if (network?.metadata?.slug !== undefined) {
          NETWORK_NAME_CHAIN_ID_MAP[network.metadata.slug] = network.ethereum_network_id;
        }

        CHAIN_ID_NETWORK_NAME_MAP[network.ethereum_network_id] = network.slug;

        for (slug of network.metadata.secondary_slugs) {
          NETWORK_NAME_CHAIN_ID_MAP[slug] = network.ethereum_network_id;
        }
      }
    })
    .catch((_) => {
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

  const tenderlyService = new TenderlyService(PLUGIN_NAME);
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

  const tenderlyService = new TenderlyService(PLUGIN_NAME);
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
