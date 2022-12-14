import { task } from "hardhat/config";
import { HardhatPluginError } from "hardhat/plugins";
import { TenderlyService } from "tenderly";

import { logger } from "../utils/logger";
import { PLUGIN_NAME } from "../constants";
import { newCompilerConfig } from "../utils/util";
import { extractContractData } from "./common";

const tenderlyService = new TenderlyService(PLUGIN_NAME);

task("tenderly:verify", "Verifies contracts on Tenderly")
  .addOptionalVariadicPositionalParam(
    "contracts",
    "Addresses and names of contracts that will be verified formatted ContractName=Address"
  )
  .setAction(verifyContract);

async function verifyContract({ contracts }: any, { config, hardhatArguments, run }: any) {
  logger.info("Public verification hardhat task has been invoked.");
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
}
