import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TENDERLY_API_BASE_URL } from "tenderly/common/constants";
import { TenderlyApiService } from "tenderly/internal/core/services";
import { logger } from "../utils/logger";
import { isTenderlyGatewayNetworkConfig } from "../utils/util";

export enum VnetType {
  NULL_TYPE = "null-type",
  FORK_V1 = "fork-v1",
  FORK_V2 = "fork-v2",
  DEVNET_V1 = "devnet-v1",
  DEVNET_V2 = "devnet-v2",
  TESTNET = "testnet",
  PUBLIC_NETWORK = "public-network",
}

export async function getVnetTypeByEndpointId(
  hre: HardhatRuntimeEnvironment,
  endpointId: string,
): Promise<VnetType> {
  if (isTenderlyGatewayNetworkConfig(hre.network.config)) {
    return VnetType.PUBLIC_NETWORK;
  }

  try {
    const axiosInstance = TenderlyApiService.configureInstance();
    const resp = await axiosInstance.get<GetVnetTypeByEndpointIdResponse>(
      `${TENDERLY_API_BASE_URL}/api/v1/vnet-type/${endpointId}`,
    );
    return resp.data.vnetType;
  } catch (error) {
    logger.error(
      `Failed to get vnet type for endpoint ${endpointId}: ${error}`,
    );
    return VnetType.NULL_TYPE;
  }
}

interface GetVnetTypeByEndpointIdResponse {
  vnetType: VnetType;
}
