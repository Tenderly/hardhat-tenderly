import { task } from "hardhat/config";

import { HardhatRuntimeEnvironment } from "hardhat/types";

task("tenderly:push", "Verifies contracts on Tenderly based on the configuration in hardhat.config.js.")
  .addOptionalVariadicPositionalParam(
    "contracts",
    "Addresses and names of contracts that will be verified formatted ContractName=Address"
  )
  .setAction(pushContracts);

async function pushContracts({ contracts }: any, hre: HardhatRuntimeEnvironment) {
  new ColorLog("THIS TASK IS DEPRECATED. PLEASE USE 'tenderly:verify' TASK.")
    // .prependColor(ColorLog.BG.RED)
    .prependColor(ColorLog.TEXT.RED)
    .appendCommand(ColorLog.RESET_COLOR_CMD)
    .log();

  hre.config.tenderly.privateVerification = true;
  await hre.run("tenderly:verify", { contracts });
}

// This is just nice behavior instead of hard-coding.
// If we ever need to use colorful logs, look up Chalk.js or Colors.js.
class ColorLog {
  public static BG = {
    YELLOW: "\x1b[43m",
    RED: "\x1b[41m",
  };
  public static TEXT = {
    RED: "\x1b[31m",
    BLACK: "\x1b[30m",
    YELLOW: "\x1b[33m",
  };
  public static RESET_COLOR_CMD = "\x1b[0m";

  private msg: string;

  constructor(_msg: string) {
    this.msg = _msg;
  }

  public prependColor(color: string): ColorLog {
    this.msg = color + this.msg;
    return this;
  }

  public appendCommand(cmd: string): ColorLog {
    this.msg += cmd;
    return this;
  }

  public log(): void {
    console.log(this.msg);
  }
}
