import "./type-extensions";
import "./tasks";

import * as tenderlyExtender from "./tenderly/extender";

export function setup(
  cfg: { automaticVerifications: boolean } = { automaticVerifications: true },
): void {
  process.env.AUTOMATIC_VERIFICATION_ENABLED =
    cfg.automaticVerifications === true ? "true" : "false";
  tenderlyExtender.setup();
}

// ProxyPlaceholderName is used for the name in the `tenderly.verify` method because the name is actually not important.
// Beneath we use `@nomicfoundation/hardhat-verify` task in order to verify the proxy, and it doesn't need a name.
export const ProxyPlaceholderName = "ProxyPlaceholderName";
