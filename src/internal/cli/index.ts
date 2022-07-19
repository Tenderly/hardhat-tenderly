#! /usr/bin/env node
import { Command } from "commander";
import { NetworksCommand } from "./commands";

(async () => {
  try {
    const program = new Command();
    program.addCommand(NetworksCommand);

    await program.parseAsync(process.argv);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();