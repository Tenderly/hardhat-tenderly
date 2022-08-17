import * as childProcess from "child_process";
import * as path from "path";
import supportsHyperlinks from "supports-hyperlinks";
import commander from "commander";
import promptly from "promptly";

import { initTemplate, templateExists, writeTemplate } from "../../../utils/template";

export const VNetCommand = new commander.Command("vnet")
  .description("configure and start Tenderly VNet")
  .option("-t, --template <path>", "vnet template path", "vnet.template.json")
  .option("-s, --save-chain-config", "save chain config to template")
  .option("-v, --verbose", "print all json rpc calls")
  .action(async options => {
    const filepath: string = options.template;
    const verbose: boolean = options.verbose;
    const saveChainConfig: boolean = options.saveChainConfig;

    if (!templateExists(filepath)) {
      initTemplate(filepath);

      const projectSlug = await promptly.prompt("Tenderly project slug:");
      const username = await promptly.prompt("Tenderly username/organization slug:");
      const network = await promptly.prompt(
        "Network name (see `npx tenderly networks` for list of supported networks):"
      );
      const blockNumber = await promptly.prompt("Network block number:", {
        validator
      });

      writeTemplate(filepath, projectSlug, username, network, blockNumber);
    }

    if (saveChainConfig) {
      console.log(
        "\nNote: This will use a default chain config. If you need to modify it, edit the generated template and restart the vnet."
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
      "..",
      "dist",
      "internal",
      "cli",
      "commands",
      "vnetServer.js"
    )} ${filepath} ${verbose} ${saveChainConfig}`
  );
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);

  await new Promise(resolve => {
    child.on("close", resolve);
  });
}

const validator = function(value: string | number) {
  if ((value as string) == "latest") {
    return value;
  }

  if (!Number.isNaN(Number(value))) {
    return value;
  }

  throw new Error("Invalid block number: must be a number or latest\n");
};
