import { VnetType } from "../tenderly/vnet-type";

const tenderlyApiURL = "http://localhost:8003/api/v1/";
export function composeApiURL(vnetType: VnetType): string {
  switch (vnetType) {
    case VnetType.NULL_TYPE:
      return "";
    case VnetType.FORK_V1:
      return (
        `${tenderlyApiURL}` +
        `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
        `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
        `etherscan/verify/` +
        `fork/${process.env.TENDERLY_FORK_V1_RESOURCE_ID ?? ""}`
      );
    case VnetType.FORK_V2:
      return (
        `${tenderlyApiURL}` +
        `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
        `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
        `etherscan/verify/` +
        `fork/${process.env.TENDERLY_FORK_RESOURCE_ID ?? ""}`
      );
    case VnetType.DEVNET_V1:
      return (
        `${tenderlyApiURL}` +
        `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
        `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
        `etherscan/verify/` +
        `devnet/${process.env.TENDERLY_DEVNET_V1_RESOURCE_ID ?? ""}`
      );
    case VnetType.DEVNET_V2:
      return (
        `${tenderlyApiURL}` +
        `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
        `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
        `etherscan/verify/` +
        `devnet/${process.env.TENDERLY_DEVNET_RESOURCE_ID ?? ""}`
      );
    case VnetType.TESTNET:
      return (
        `${tenderlyApiURL}` +
        `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
        `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
        `etherscan/verify/` +
        `testnet/${process.env.TENDERLY_TESTNET_RESOURCE_ID ?? ""}`
      );
    case VnetType.PUBLIC_NETWORK:
      return (
        `${tenderlyApiURL}` +
        `account/${process.env.TENDERLY_USERNAME ?? ""}/` +
        `project/${process.env.TENDERLY_PROJECT ?? ""}/` +
        `etherscan/verify/` +
        `network/11155111`
      );
    default:
      throw new Error("Unknown VnetType.");
  }
}

export function composeBrowserURL(vnetType: VnetType): string {
  switch (vnetType) {
    case VnetType.NULL_TYPE:
      return "";
    case VnetType.FORK_V1:
      return "custom-invalid-url";
    case VnetType.FORK_V2:
      return "";
    case VnetType.DEVNET_V1:
      return "";
    case VnetType.DEVNET_V2:
      return "";
    case VnetType.TESTNET:
      return "";
    case VnetType.PUBLIC_NETWORK:
      return "";
    default:
      throw new Error("Unknown VnetType.");
  }
}
