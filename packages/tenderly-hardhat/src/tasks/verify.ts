import { task } from "hardhat/config";
import { HardhatPluginError } from "hardhat/plugins";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { logger } from "../utils/logger";
import { PLUGIN_NAME } from "../constants";
import { ContractByName } from "../tenderly/types";

task("tenderly:verify", "Verifies contracts on Tenderly based on the configuration in hardhat.config.js.")
  .addOptionalVariadicPositionalParam(
    "contracts",
    "Addresses and names of contracts that will be verified formatted ContractName=Address"
  )
  .setAction(verifyContract);

async function verifyContract({ contracts }: any, hre: HardhatRuntimeEnvironment) {
  logger.info("Verification via tenderly:push hardhat task is invoked.");

  if (contracts === undefined) {
    throw new HardhatPluginError(PLUGIN_NAME, `At least one contract must be provided (ContractName=Address)`);
  }

  const formattedContracts: ContractByName[] = [];
  for (const contract of contracts) {
    const [name, address] = contract.split("=");
    formattedContracts.push({ name, address });
  }

  await hre.tenderly.verify(...formattedContracts);
}
