// isTenderlyNetworkConfig checks if a network belongs to tenderly by checking the rpc_url.
// This is done so the user can put custom network names in the hardhat config and still use them with tenderly.
// This is also done so the user can use multiple tenderly networks in their hardhat config file.
import { HttpNetworkConfig, NetworkConfig } from "hardhat/types";

export const isTenderlyNetworkConfig = (nw: NetworkConfig): boolean => {
  if (nw === undefined || nw === null) {
    return false;
  }
  if (!isHttpNetworkConfig(nw)) {
    return false;
  }

  // The network belongs to tenderly if the rpc_url is one of the following:
  // - https://rpc.vnet.tenderly.co/devnet/...
  // - https://<network_name>.rpc.tenderly.co/...
  // - https://virtual.<network_name>.rpc.tenderly.co/...
  // - https://rpc.tenderly.co/...
  const regex =
    /^https?:\/\/(?:rpc\.vnet\.tenderly\.co\/devnet\/|(?:[\w-]+\.rpc|rpc)\.tenderly\.co\/|virtual\.[\w-]+\.rpc\.tenderly\.co\/).*$/;
  return regex.test(nw.url);
};

export function isTenderlyGatewayNetworkConfig(nw: NetworkConfig): boolean {
  if (nw === undefined || nw === null) {
    return false;
  }
  if (!isHttpNetworkConfig(nw)) {
    return false;
  }

  const regex = /^https?:\/\/[\w-]+\.gateway\.tenderly\.co\/.*$/;
  return regex.test(nw.url);
}

export function isHttpNetworkConfig(
  config: NetworkConfig,
): config is HttpNetworkConfig {
  return (config as HttpNetworkConfig).url !== undefined;
}
