import "@nomiclabs/hardhat-ethers";
import "./type-extensions";
import "./tasks";

import * as tenderlyExtender from "./tenderly/extender";

export function setup(
  cfg: { automaticVerifications: boolean; minLogLevel?: number } = { automaticVerifications: false, minLogLevel: 7 }
): void {
  process.env.AUTOMATIC_VERIFICATION_ENABLED = cfg.automaticVerifications === true ? "true" : "false";
  process.env.MIN_LOG_LEVEL = cfg.minLogLevel !== undefined ? cfg.minLogLevel.toString() : "7";

  tenderlyExtender.setup();
}
