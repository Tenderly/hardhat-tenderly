import "@nomiclabs/hardhat-ethers";
import "./tenderly/extender";
import "./type-extensions";
import "./tasks";

export function setup({ automaticVerifications = false }): void {
  process.env.AUTOMATIC_VERIFICATION_ENABLED = automaticVerifications === true ? "true" : "false";
}
