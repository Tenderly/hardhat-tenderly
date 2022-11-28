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
    minLogLevelHardhat: 4,
    minLogLevelService: 4,
  }
): void {
  process.env.AUTOMATIC_VERIFICATION_ENABLED = cfg.automaticVerifications === true ? "true" : "false";

  /*
   * Log levels in tslog
   * 0 - silly
   * 1 - trace
   * 2 - debug
   * 3 - info
   * 4 - warning
   * 5 - error
   * 6 - fatal
   */
  process.env.MIN_LOG_LEVEL_HARDHAT = cfg.minLogLevelHardhat !== undefined ? cfg.minLogLevelHardhat.toString() : "4";
  process.env.MIN_LOG_LEVEL_SERVICE = cfg.minLogLevelService !== undefined ? cfg.minLogLevelService.toString() : "4";

  tenderlyExtender.setup();
}
