import { task } from "hardhat/config";
import { HardhatPluginError } from "hardhat/plugins";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { logger } from "../utils/logger";
import { PLUGIN_NAME } from "../constants";
import { ContractByName } from "../tenderly/types";

task("tenderly:verify", "Verifies contracts on Tenderly based on the configuration in hardhat.config.js.")
  .addVariadicPositionalParam(
    "contracts",
    "Addresses and names of contracts that will be verified formatted like `ContractName1=0x... ContractName2=0x...`"
  )
  .addOptionalParam(
    "libraries",
    "Libraries that contracts will use formatted like `ContractName1=LibraryName1:0x...,LibraryName2:0x...#ContractName2=LibraryName3:0x...,LibraryName4:0x...`"
  )
  .setAction(verifyContract);

async function verifyContract({ contracts, libraries }: any, hre: HardhatRuntimeEnvironment) {
  logger.info("Verification via tenderly:verify hardhat task is invoked.");

  if (contracts === undefined) {
    throw new HardhatPluginError(PLUGIN_NAME, `At least one contract must be provided (ContractName=Address)`);
  }

  const formattedContracts: ContractByName[] = [];
  const librariesMap = extractLibraries(libraries);
  for (const contract of contracts) {
    const [name, address] = contract.split("=");
    formattedContracts.push({
      name,
      address,
      libraries: librariesMap[name] || {},
    });
  }

  await hre.tenderly.verify(...formattedContracts);
}

function extractLibraries(librariesParameter: string) {
  const libraries: any = {};
  for (const library of librariesParameter.split("#")) {
    const [contractName, contractLibraries] = library.split("=");
    libraries[contractName] = {};
    for (const contractLibrary of contractLibraries.split(",")) {
      const [libraryName, libraryAddress] = contractLibrary.split(":");
      libraries[contractName][libraryName] = libraryAddress;
    }
  }
  return libraries;
}
