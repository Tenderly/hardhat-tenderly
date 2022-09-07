/* eslint-disable @typescript-eslint/restrict-template-expressions */
import * as childProcess from "child_process";
import * as path from "path";
import commander from "commander";
import prompts from "prompts";

import { configExists, writeConfig } from "../../virtual-network/utils/config";
import { TenderlyService } from "../../core/services/TenderlyService";
import { PLUGIN_NAME } from "../../../common/constants";

const supportsHyperlinks = require("supports-hyperlinks");

const tenderlyService = new TenderlyService(PLUGIN_NAME);

export const VNetCommand = new commander.Command("vnet")
  .description("configure and start Tenderly VNet")
  .option("-t, --template <path>", "vnet template path", "vnet.template.json")
  .option("-s, --save-chain-config", "save chain config to template")
  .option("-v, --verbose", "print all json rpc calls")
  .action(async (options) => {
    const filepath: string = options.template;
    const verbose: boolean = options.verbose;
    const saveChainConfig: boolean = options.saveChainConfig;

    if (!configExists(filepath)) {
      const [projectSlug, username] = await promptProject();
      const network = await promptNetwork();
      const blockNumber = await promptBlockNumber();

      writeConfig(filepath, {
        project_slug: projectSlug,
        username,
        network,
        block_number: blockNumber,
      });
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

async function promptProject(): Promise<[string, string]> {
  const principal = await tenderlyService.getPrincipal();
  if (principal === null) {
    process.exit(1);
  }
  const projects = await tenderlyService.getProjectSlugs(principal.id);
  projects.sort((a, b) => a.name.localeCompare(b.name));

  const projectChoices = projects.map((project) => {
    return {
      title: project.name,
      value: { slug: project.slug, username: project.owner.username },
    };
  });

  const response = await prompts({
    type: "autocomplete",
    name: "project",
    message: "Tenderly project",
    initial: projects[0].slug,
    choices: projectChoices,
  });

  return [response.project.slug, response.project.username];
}

async function promptNetwork(): Promise<string> {
  const networks = await tenderlyService.getNetworks();
  const filteredNetworks = networks.filter((element) => {
    return element.metadata.exclude_from_listing === undefined || element.metadata.exclude_from_listing === false;
  });
  filteredNetworks.sort((a, b) => a.sort_order - b.sort_order);
  const networkChoices = filteredNetworks.map((network) => {
    return {
      title: network.name,
      value: network.ethereum_network_id,
    };
  });

  const response = await prompts({
    type: "autocomplete",
    name: "network",
    message: "Network",
    initial: "Mainnet",
    choices: networkChoices,
  });

  return response.network;
}

async function promptBlockNumber(): Promise<string> {
  const question: prompts.PromptObject = {
    type: "text",
    name: "blockNumber",
    message: "Block number",
    initial: "latest",
    validate: validator,
  };
  const response = await prompts(question);

  return response.blockNumber;
}

function validator(value: any): boolean | string {
  if ((value as string) === "latest") {
    return true;
  }

  if (!Number.isNaN(Number(value))) {
    return true;
  }

  return "Invalid block number: must be a number or latest\n";
}

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
