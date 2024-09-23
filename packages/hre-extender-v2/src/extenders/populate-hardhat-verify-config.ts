// Returns true if the user has selected automatic population of hardhat-verify `etherscan` configuration through the TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG env variable,
// and the network is some of the Tenderly networks.
import { HardhatRuntimeEnvironment, Network } from "hardhat/types";
import {
  isHttpNetworkConfig,
  isTenderlyGatewayNetworkConfig,
  isTenderlyNetworkConfig,
} from "./tenderly-network-resolver";
import { getAccessToken } from "@tenderly/api-client/utils/config";
import { logger } from "../logger";
import { getVnetTypeByEndpointId, VnetType } from "@tenderly/hardhat-integration/dist/tenderly/vnet-type";
import * as URLComposer from "@tenderly/hardhat-integration/dist/utils/url-composer";

export function shouldPopulateHardhatVerifyConfig(
  hre: HardhatRuntimeEnvironment,
): boolean {
  return (
    // Must cover both since AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG is the legacy because we didn't use the TENDERLY_ prefix.
    (process.env.TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG === "true" ||
      process.env.AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG === "true") &&
    (isTenderlyNetworkConfig(hre.network.config) ||
      isTenderlyGatewayNetworkConfig(hre.network.config)) &&
    isHttpNetworkConfig(hre.network.config)
  );
}
//
// populateHardhatVerifyConfig will populate `hre.config.etherscan` configuration of the `@nomicfoundation/hardhat-verify` plugin.
// This function should import `@nomicfoundation/hardhat-verify` type declaration expansion of the `HardhatConfig`, but can't since there will be double overloading task error if the client application also uses `@nomicfoundation/hardhat-verify` plugin.
export async function populateHardhatVerifyConfig(
  hre: HardhatRuntimeEnvironment,
): Promise<void> {
  if (
    (!isTenderlyNetworkConfig(hre.network.config) &&
      !isTenderlyGatewayNetworkConfig(hre.network.config)) ||
    !isHttpNetworkConfig(hre.network.config)
  ) {
    return;
  }

  const accessKey = getAccessToken();
  if (accessKey === "") {
    logger.error(
      "Tenderly access key is not set. Please set TENDERLY_ACCESS_KEY environment variable.",
    );
    return;
  }

  if (
    (hre.config as any).etherscan === undefined ||
    (hre.config as any).etherscan === null
  ) {
    (hre.config as any).etherscan = {
      apiKey: accessKey,
      customChains: [],
    };
  }

  if (
    isRecord((hre.config as any).etherscan.apiKey) &&
    (hre.config as any).etherscan.apiKey[hre.network.name] === undefined
  ) {
    (hre.config as any).etherscan.apiKey[hre.network.name] = accessKey;
  } else if (typeof (hre.config as any).etherscan.apiKey === "string") {
    (hre.config as any).etherscan.apiKey = accessKey;
  }

  const chainId = await getChainId(hre.network);

  const endpointId = hre.network.config.url.split("/").pop();
  if (endpointId === undefined) {
    throw new Error(
      "Could not locate the UUID at the end of a Tenderly RPC URL.",
    );
  }

  const vnetType = await getVnetTypeByEndpointId(hre, endpointId);
  if (vnetType === VnetType.NULL_TYPE) {
    throw new Error("Couldn't recognize VnetType from endpoint id.");
  }

  (hre.config as any).etherscan.customChains.push({
    network: hre.network.name,
    chainId,
    urls: {
      apiURL: URLComposer.composeApiURL(hre, endpointId, chainId, vnetType),
      browserURL: URLComposer.composeBrowserURL(
        hre,
        endpointId,
        chainId,
        vnetType,
      ),
    },
  });
}

export async function findEtherscanConfig(
  hre: HardhatRuntimeEnvironment,
): Promise<any | undefined> {
  if ((hre.config as any).etherscan === undefined) {
    return undefined;
  }
  if ((hre.config as any).etherscan.customChains === undefined) {
    return undefined;
  }

  return ((hre.config as any).etherscan.customChains as any[]).find(
    (chainConfig) => {
      return chainConfig.network === hre.network.name;
    },
  );
}


function isRecord(value: any): value is Record<string, string> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getChainId(network: Network): Promise<number> {
  if (network.config.chainId !== undefined && network.config.chainId !== null) {
    return network.config.chainId;
  }

  return Number(await network.provider.send("eth_chainId", []));
}

