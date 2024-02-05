import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TENDERLY_API_BASE_URL } from "tenderly/common/constants";
import { VnetType } from "../tenderly/vnet-type";

export function composeApiURL(
  hre: HardhatRuntimeEnvironment,
  endpointId: string,
  chainId: number,
  vnetType: VnetType,
): string {
  switch (vnetType) {
    case VnetType.NULL_TYPE:
      return "";
    case VnetType.FORK_V1:
    case VnetType.FORK_V2:
      return (
        `${TENDERLY_API_BASE_URL}/api/v1/` +
        `account/${hre.config.tenderly?.username}/` +
        `project/${hre.config.tenderly?.project}/` +
        `etherscan/verify/` +
        `fork/${endpointId}`
      );
    case VnetType.DEVNET_V1:
    case VnetType.DEVNET_V2:
      return (
        `${TENDERLY_API_BASE_URL}/api/v1/` +
        `account/${hre.config.tenderly?.username}/` +
        `project/${hre.config.tenderly?.project}/` +
        `etherscan/verify/` +
        `devnet/${endpointId}`
      );
    case VnetType.TESTNET:
      return (
        `${TENDERLY_API_BASE_URL}/api/v1/` +
        `account/${hre.config.tenderly?.username}/` +
        `project/${hre.config.tenderly?.project}/` +
        `etherscan/verify/` +
        `testnet/${endpointId}`
      );
    case VnetType.PUBLIC_NETWORK:
      return (
        `${TENDERLY_API_BASE_URL}/api/v1/` +
        `account/${hre.config.tenderly?.username}/` +
        `project/${hre.config.tenderly?.project}/` +
        `etherscan/verify/` +
        `network/${chainId}` +
        `${hre.config.tenderly?.privateVerification === true ? "" : "/public"}`
      );
    default:
      throw new Error("Unknown VnetType.");
  }
}

export function composeBrowserURL(
  hre: HardhatRuntimeEnvironment,
  endpointId: string,
  chainId: number,
  vnetType: VnetType,
): string {
  switch (vnetType) {
    case VnetType.NULL_TYPE:
      return "";
    case VnetType.FORK_V1:
    case VnetType.FORK_V2:
    case VnetType.DEVNET_V1:
    case VnetType.DEVNET_V2:
    case VnetType.TESTNET:
      return (
        `${TENDERLY_API_BASE_URL}/api/v1/` +
        `account/${hre.config.tenderly?.username}/` +
        `project/${hre.config.tenderly?.project}/` +
        `vnet-type/${vnetType}/${endpointId}/browser-url`
      );
    case VnetType.PUBLIC_NETWORK:
      return (
        `${TENDERLY_API_BASE_URL}/api/v1/` +
        `account/${hre.config.tenderly?.username}/` +
        `project/${hre.config.tenderly?.project}/` +
        `vnet-type/${vnetType}/${chainId}/browser-url`
      );
    default:
      throw new Error("Unknown VnetType.");
  }
}
