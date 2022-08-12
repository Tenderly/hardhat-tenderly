import * as childProcess from "child_process";
import commander from "commander";
import * as path from "path";
import promptly from "promptly";
import {
  initTemplate,
  templateExists,
  writeTemplate,
} from "../../../utils/template";

export const VNetCommand = new commander.Command("vnet")
  .description("configure and start Tenderly VNet")
  .option("-t, --template <path>", "vnet template path", "vnet.template.json")
  .action(async (options) => {
    const filepath = options.template;

    if (!templateExists(filepath)) {
      initTemplate(filepath);

      const projectSlug = await promptly.prompt("Tenderly project slug:");
      const username = await promptly.prompt(
        "Tenderly username/organization slug:"
      );
      const network = await promptly.prompt(
        "Network name (see tenderly networks for list of supported networks):"
      );
      const blockNumber = await promptly.prompt("Network block number:", {
        validator,
      });

      writeTemplate(filepath, projectSlug, username, network, blockNumber);
    }

    await startServer(filepath);
  });

async function startServer(filepath: string) {
  const child = childProcess.exec(
    `node ${path.resolve(
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
    )} ${filepath}`
  );
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  await new Promise((resolve) => {
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
