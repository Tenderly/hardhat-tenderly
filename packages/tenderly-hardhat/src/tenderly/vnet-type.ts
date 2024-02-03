import { HardhatRuntimeEnvironment } from "hardhat/types";

export enum VnetType {
  NULL_TYPE = "null-type",
  FORK_V1 = "fork-v1",
  FORK_V2 = "fork-v2",
  DEVNET_V1 = "devnet-v1",
  DEVNET_V2 = "devnet-v2",
  TESTNET = "testnet",
  PUBLIC_NETWORK = "public-network",
}

export async function getVnetTypeByEndpointId(hre: HardhatRuntimeEnvironment, endpointId: string): Promise<VnetType> {
  switch (hre.network.name) {
    case "fork":
      return VnetType.FORK_V2;
    case "fork-v1":
      return VnetType.FORK_V1;
    case "testnet":
      return VnetType.TESTNET;
    case "devnet":
      return VnetType.DEVNET_V2;
    case "devnet-v1":
      return VnetType.DEVNET_V1;
  }
  return VnetType.NULL_TYPE;
}
