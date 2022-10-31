#! /usr/bin/env node
import { Command } from "commander";
import { NetworksCommand, LoginCommand } from "./commands";

process.openStdin().on("keypress", (chunk, key) => {
  if (key && key.name === "c" && key.ctrl) {
    process.exit();
  }
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    const program = new Command();
    program.addCommand(LoginCommand);
    program.addCommand(NetworksCommand);

    await program.parseAsync(process.argv);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
