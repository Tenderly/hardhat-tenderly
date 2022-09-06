#! /usr/bin/env node
import { Command } from "commander";
import { NetworksCommand } from "./commands";
import { LoginCommand } from "./commands";
import { VNetCommand } from "./commands";

process.openStdin().on("keypress", function (chunk, key) {
  if (key && key.name === "c" && key.ctrl) {
    process.exit();
  }
});

(async () => {
  try {
    const program = new Command();
    program.addCommand(LoginCommand);
    program.addCommand(NetworksCommand);
    program.addCommand(VNetCommand);

    await program.parseAsync(process.argv);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
