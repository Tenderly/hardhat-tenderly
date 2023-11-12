import "./type-extensions";
import "./tasks";

import * as tenderlyExtender from "./tenderly/extender";

export function setup(cfg: { automaticVerifications: boolean } = { automaticVerifications: false }): void {
  process.env.AUTOMATIC_VERIFICATION_ENABLED = cfg.automaticVerifications === true ? "true" : "false";
  tenderlyExtender.setup();
}
