import "@nomiclabs/hardhat-ethers";
import { extendConfig, extendEnvironment, task } from "hardhat/config";
import { HardhatPluginError, lazyObject } from "hardhat/plugins";
import { RunTaskFunction } from "hardhat/src/types";
import {
  ActionType,
  HardhatConfig,
  HardhatRuntimeEnvironment
} from "hardhat/types";

import { Tenderly } from "./Tenderly";
import { TenderlyService } from "./tenderly/TenderlyService";
import { TenderlyContract } from "./tenderly/types";
import "./type-extensions";

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
  hre.tenderly
    .network()
    .initializeFork()
    .then(_ => {
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
  poa: "99"
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
  "99": "poa"
};

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

  for (contract of contracts) {
    const contractData = contract.split("=");
    if (contractData.length < 2) {
      throw new HardhatPluginError(PluginName, `Invalid contract provided`);
    }

    if (network === undefined) {
      throw new HardhatPluginError(PluginName, `No network provided`);
    }

    data._resolvedFiles.forEach((resolvedFile, _) => {
      const name = resolvedFile.sourceName.split("/").slice(-1)[0];
      const contractToPush: TenderlyContract = {
        contractName: name.split(".")[0],
        source: resolvedFile.content.rawContent,
        sourcePath: resolvedFile.sourceName,
        networks: {},
        compiler: {
          name: "solc",
          version: config.solidity.compilers[0].version
        }
      };
      if (contractToPush.contractName === contractData[0]) {
        contractToPush.networks = {
          [NetworkMap[network!.toLowerCase()]]: {
            address: contractData[1]
          }
        };
      }
      requestContracts.push(contractToPush);
    });
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
