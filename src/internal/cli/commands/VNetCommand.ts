import * as childProcess from "child_process";
import * as path from "path";
import supportsHyperlinks from "supports-hyperlinks";
import commander from "commander";
import prompts from "prompts";

import { templateExists, writeTemplate } from "../../../utils/template";
import { TenderlyService } from "../../../tenderly/TenderlyService";

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
      const [projectSlug, username] = await promptProject();
      const network = await promptNetwork();
      const blockNumber = await promptBlockNumber();

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

async function promptProject(): Promise<[string, string]> {
  const principalId = (await TenderlyService.getPrincipal()).id;
  const projects = await TenderlyService.getProjectSlugs(principalId);
  projects.sort((a, b) => a.name.localeCompare(b.name));

  const projectChoices = projects.map(function(project) {
    return {
      title: project.name,
      value: { slug: project.slug, username: project.owner.username }
    };
  });

  const question: prompts.PromptObject = {
    type: "autocomplete",
    name: "project",
    message: "Tenderly project",
    initial: projects[0].slug,
    choices: projectChoices
  };

  const response = await prompts(question);

  return [response.project.slug, response.project.username];
}

async function promptNetwork(): Promise<string> {
  const networks = await TenderlyService.getPublicNetworks();
  const filteredNetworks = networks.filter(function(element) {
    return element.metadata.exclude_from_listing === undefined || element.metadata.exclude_from_listing === false;
  });
  filteredNetworks.sort((a, b) => a.sort_order - b.sort_order);
  const networkChoices = filteredNetworks.map(function(network) {
    return {
      title: network.name,
      value: network.ethereum_network_id
    };
  });

  const question: prompts.PromptObject = {
    type: "autocomplete",
    name: "network",
    message: "Network",
    initial: "Mainnet",
    choices: networkChoices
  };
  const response = await prompts(question);

  return response.network;
}

async function promptBlockNumber(): Promise<string> {
  const question: prompts.PromptObject = {
    type: "text",
    name: "blockNumber",
    message: "Block number",
    initial: "latest",
    validate: validator
  };
  const response = await prompts(question);

  return response.blockNumber;
}

const validator = function(value) {
  if ((value as string) == "latest") {
    return true;
  }

  if (!Number.isNaN(Number(value))) {
    return true;
  }

  return "Invalid block number: must be a number or latest\n";
};

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
