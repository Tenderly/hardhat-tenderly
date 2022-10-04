/* eslint-disable @typescript-eslint/restrict-template-expressions */
import * as childProcess from "child_process";
import * as path from "path";
import commander from "commander";

import { configExists, writeConfig } from "../../virtual-network/utils/config";
import { PLUGIN_NAME } from "../../../common/constants";
import { VirtualNetworkService } from "../../virtual-network/services";

const supportsHyperlinks = require("supports-hyperlinks");

const virtualNetworkService = new VirtualNetworkService(PLUGIN_NAME);

export const VNetCommand = new commander.Command("vnet")
  .description("configure and start Tenderly VNet")
  .option("-t, --config <path>", "vnet config path", "vnet.config.json")
  .option("-s, --save-chain-config", "save chain config to vnet config")
  .option("-v, --verbose", "print all json rpc calls")
  .action(async (options) => {
    const filepath: string = options.config;
    const verbose: boolean = options.verbose;
    const saveChainConfig: boolean = options.saveChainConfig;

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

    await startServer(filepath, verbose, saveChainConfig);
  });

async function startServer(filepath: string, verbose: boolean, saveChainConfig: boolean) {
  const child = childProcess.exec(
    `SUPPORTS_HYPERLINKS=${supportsHyperlinks.stdout} node ${path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "internal",
      "virtual-network",
      "jsonrpc",
      "server.js"
    )} ${filepath} ${verbose} ${saveChainConfig}`
  );
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);

  await new Promise((resolve) => {
    child.on("close", resolve);
  });
}
