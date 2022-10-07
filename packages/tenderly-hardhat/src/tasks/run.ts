import { task } from "hardhat/config";
import { boolean } from "hardhat/internal/core/params/argumentTypes";
import { HttpNetworkConfig } from "hardhat/types";
import { VirtualNetworkService } from "tenderly";
import { TENDERLY_DASHBOARD_BASE_URL } from "tenderly/src/common/constants";
import {
  configExists,
  writeConfig,
  getConfig,
  updateChainConfig,
} from "tenderly/src/internal/virtual-network/utils/config";

import { PLUGIN_NAME } from "../constants";

const virtualNetworkService = new VirtualNetworkService(PLUGIN_NAME);

task("run", "Runs a user-defined script after compiling the project")
  .addOptionalParam("vnetConfig", "Virtual Network path to config file", "vnet.config.json")
  .addOptionalParam("verifyOnDeploy", "If it is true it will verify the contract on deploy", false, boolean)
  .addFlag("saveChainConfig", "Save default chain config to config file")
  .setAction(async (taskArguments, hre, runSuper) => {
    const filepath: string = taskArguments.vnetConfig;
    const saveChainConfig: boolean = taskArguments.saveChainConfig;

    if (!configExists(filepath)) {
      const [projectSlug, username] = await virtualNetworkService.promptProject();
      const network = await virtualNetworkService.promptNetwork();
      const blockNumber = await virtualNetworkService.promptBlockNumber();

      writeConfig(filepath, {
        project_slug: projectSlug,
        username,
        network,
        block_number: blockNumber,
      });
    }

    if (saveChainConfig) {
      console.log(
        "\nNote: This will use a default chain config. If you need to modify it, edit the generated config file and restart the vnet."
      );
    }
    // New line
    console.log();

    const config = getConfig(filepath);
    const vnet = await virtualNetworkService.createVNet(
      config.username,
      config.project_slug,
      config.network,
      config.block_number,
      config.chain_config
    );
    if (vnet === null) {
      process.exit(1);
    }

    if (saveChainConfig) {
      updateChainConfig(filepath, vnet.chain_config);
    }

    process.env.AUTOMATIC_VERIFICATION_ENABLED = taskArguments.verifyOnDeploy;
    process.env.VNET_URL = `https://rpc.tenderly.co/vnet/${vnet.id}`;
    (hre.config.networks.tenderly as HttpNetworkConfig).url = process.env.VNET_URL;

    await runSuper(taskArguments);

    console.log(
      `\nView transactions in dashboard: ${TENDERLY_DASHBOARD_BASE_URL}/${config.username}/${config.project_slug}/fork/${vnet.id}`
    );
  });
