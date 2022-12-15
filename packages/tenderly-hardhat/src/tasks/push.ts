import { HardhatPluginError } from "hardhat/plugins";
import { task } from "hardhat/config";
import { TenderlyService } from "tenderly";

import { logger } from "../utils/logger";
import { PLUGIN_NAME } from "../constants";
import { newCompilerConfig } from "../utils/util";
import { extractContractData } from "./common";

const tenderlyService = new TenderlyService(PLUGIN_NAME);

task("tenderly:push", "Privately pushes contracts to Tenderly")
  .addOptionalVariadicPositionalParam(
    "contracts",
    "Addresses and names of contracts that will be verified formatted ContractName=Address"
  )
  .setAction(pushContracts);

async function pushContracts({ contracts }: any, { config, hardhatArguments, run }: any) {
  logger.info("Private verification hardhat task has been invoked.");

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
}
