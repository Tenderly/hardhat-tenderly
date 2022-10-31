import "@nomiclabs/hardhat-ethers";
import "./type-extensions";
import "./tasks";

import * as tenderlyExtender from "./tenderly/extender";

export function setup({ automaticVerifications = false }): void {
  process.env.AUTOMATIC_VERIFICATION_ENABLED = automaticVerifications === true ? "true" : "false";
  tenderlyExtender.setup();
}
