import "./tasks";
import "./utils/logger";

export { Tenderly } from "./Tenderly";
export { TenderlyNetwork } from "./TenderlyNetwork";
export * from "./type-extensions";

// ProxyPlaceholderName is used for the `name` parameter in the `tenderly.verify` method because the name is actually not important.
// Beneath we use `@nomicfoundation/hardhat-verify` task in order to verify the proxy, and it doesn't need a name.
export const ProxyPlaceholderName = "ProxyPlaceholderName";
