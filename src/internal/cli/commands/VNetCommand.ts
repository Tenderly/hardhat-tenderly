import commander from "commander";
import * as path from "path";
import * as childProcess from "child_process";

export const VNetCommand = new commander.Command("vnet")
  .description("configure and start Tenderly VNet")
  .action(async () => {
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
      )}`
    );
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    await new Promise((resolve) => {
      child.on("close", resolve);
    });
  });
