import {extendEnvironment} from "@nomiclabs/buidler/config";
import {BuidlerPluginError, lazyObject} from "@nomiclabs/buidler/plugins";
import {RunTaskFunction} from "@nomiclabs/buidler/src/types";
import {ActionType, ResolvedBuidlerConfig} from "@nomiclabs/buidler/types";
import {task} from "@nomiclabs/buidler/config";

import {Tenderly} from "./Tenderly";
import {TenderlyService} from "./tenderly/TenderlyService"
import {TenderlyContract} from "./tenderly/types";

export const PluginName = "buidler-tenderly"

export default function () {
  extendEnvironment(env => {
    env.tenderly = lazyObject(() => new Tenderly(env));
  });
}

interface VerifyArguments {
  contracts: string[]
}

export const NetworkMap: Record<string, string> = {
  "kovan": "42",
  "goerli": "5",
  "mainnet": "1",
  "rinkeby": "4",
  "ropsten": "3",
  "mumbai": "80001",
  "xDai": "100",
  "POA": "99",
}

const extractContractData = async (
  contracts: string[],
  network: string | undefined,
  config: ResolvedBuidlerConfig,
  run: RunTaskFunction,
): Promise<TenderlyContract[]> => {
  let contract: string
  const requestContracts: TenderlyContract[] = [];
  const data = await run("compile:get-compiler-input");
  for (contract of contracts) {
    const contractData = contract.split("=")
    if (contractData.length < 2) {
      throw new BuidlerPluginError(PluginName, `Invalid contract provided`)
    }

    if (network == undefined) {
      throw new BuidlerPluginError(PluginName, `No network provided`)
    }

    Object.keys(data.sources).forEach((key, _) => {
      const name = key.split("/").slice(-1)[0];
      const contractToPush: TenderlyContract = {
        contractName: name.split(".")[0],
        source: data.sources[key].content,
        sourcePath: key,
        networks: {},
        compiler: {
          name: 'solc',
          version: config.solc.version
        }
      };
      if (contractToPush.contractName === contractData[0]) {
        contractToPush.networks = {
          [NetworkMap[network!]]: {
            address: contractData[1]
          }
        };
      }
      requestContracts.push(contractToPush);
    })
  }
  return requestContracts
}

const verifyContract: ActionType<VerifyArguments> = async (
  {
    contracts,
  },
  {config, buidlerArguments, run}
) => {
  const requestContracts = await extractContractData(
    contracts,
    buidlerArguments.network,
    config,
    run
  )
  const solcConfig = {
    compiler_version: config.solc.version,
    optimizations_used: config.solc.optimizer.enabled,
    optimizations_count: config.solc.optimizer.runs,
  }

  await TenderlyService.verifyContracts({
    config: solcConfig,
    contracts: requestContracts,
  })
}

const pushContracts: ActionType<VerifyArguments> = async (
  {
    contracts,
  },
  {config, buidlerArguments, run}
) => {
  const requestContracts = await extractContractData(
    contracts,
    buidlerArguments.network,
    config,
    run
  )
  const solcConfig = {
    compiler_version: config.solc.version,
    optimizations_used: config.solc.optimizer.enabled,
    optimizations_count: config.solc.optimizer.runs,
  }

  if (config["projectSlug"] == undefined) {
    throw new BuidlerPluginError(PluginName, `Please provide the projectSlug field in buidler.config.js`)
  }

  if (config["tenderlyUsername"] == undefined) {
    throw new BuidlerPluginError(PluginName, `Please provide the tenderlyUsername field in buidler.config.js`)
  }

  await TenderlyService.pushContracts({
    config: solcConfig,
    contracts: requestContracts,
  }, config["projectSlug"], config["tenderlyUsername"])
}


task("tenderly-verify", "Verifies contracts on Tenderly")
  .addOptionalVariadicPositionalParam(
    "contracts",
    "Addresses and names of contracts that will be verified formatted ContractName=Address"
  )
  .setAction(verifyContract)

task("tenderly-push", "Privately pushes contracts to Tenderly")
  .addOptionalVariadicPositionalParam(
    "contracts",
    "Addresses and names of contracts that will be verified formatted ContractName=Address"
  )
  .setAction(pushContracts)
