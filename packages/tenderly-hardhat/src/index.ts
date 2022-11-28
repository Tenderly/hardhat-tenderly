import "@nomiclabs/hardhat-ethers";
import "./type-extensions";
import "./tasks";

import * as tenderlyExtender from "./tenderly/extender";

export function setup(
  cfg: {
    automaticVerifications: boolean;
    minLogLevelHardhat?: number;
    minLogLevelService?: number;
  } = {
    automaticVerifications: false,
    minLogLevelHardhat: 7,
    minLogLevelService: 7,
  }
): void {
  process.env.AUTOMATIC_VERIFICATION_ENABLED = cfg.automaticVerifications === true ? "true" : "false";
  process.env.MIN_LOG_LEVEL_HARDHAT = cfg.minLogLevelHardhat !== undefined ? cfg.minLogLevelHardhat.toString() : "7";
  process.env.MIN_LOG_LEVEL_SERVICE = cfg.minLogLevelService !== undefined ? cfg.minLogLevelService.toString() : "7";

  tenderlyExtender.setup();
}
