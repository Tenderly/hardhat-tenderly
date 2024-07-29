import "@openzeppelin/hardhat-upgrades";
import { lazyObject } from "hardhat/plugins";
import { extendConfig, extendEnvironment } from "hardhat/config";
import {
  HardhatRuntimeEnvironment,
  HttpNetworkConfig,
  HardhatConfig,
  Network,
} from "hardhat/types";
import { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";
import { TenderlyService } from "tenderly";
import { logger as serviceLogger } from "tenderly/utils/logger";
import { TenderlyNetwork as TenderlyNetworkInterface } from "tenderly/types";
import {
  CHAIN_ID_NETWORK_NAME_MAP,
  NETWORK_NAME_CHAIN_ID_MAP,
  TENDERLY_JSON_RPC_BASE_URL,
} from "tenderly/common/constants";

import { ethers } from "ethers";
import { upgrades } from "hardhat";
import { getAccessToken } from "tenderly/utils/config";
import { logger } from "../utils/logger";
import { Tenderly } from "../Tenderly";
import { TenderlyNetwork } from "../TenderlyNetwork";
import { PLUGIN_NAME } from "../constants";
import {
  isHttpNetworkConfig,
  isTenderlyGatewayNetworkConfig,
  isTenderlyNetworkConfig,
} from "../utils/util";
import * as URLComposer from "../utils/url-composer";
import { wrapEthers, wrapUpgrades } from "./ethers";
import { wrapHHDeployments } from "./hardhat-deploy";
import { getVnetTypeByEndpointId, VnetType } from "./vnet-type";

const tenderlyService = new TenderlyService(PLUGIN_NAME);

export function setup() {
  // set to loggers to error level by default
  logger.settings.minLevel = 4;
  serviceLogger.settings.minLevel = 4;

  extendEnvironment(async (hre: HardhatRuntimeEnvironment) => {
    hre.tenderly = lazyObject(() => new Tenderly(hre));

    if (hre.hardhatArguments.verbose) {
      logger.settings.minLevel = 1; // trace level
      serviceLogger.settings.minLevel = 1; // trace level
    }
    logger.info(
      `Setting up hardhat-tenderly plugin. Log level of hardhat tenderly plugin set to: ${logger.settings.minLevel}`,
    );
    // serviceLogger is used here just for initialization, nothing else, it will be used in TenderlyService.ts
    serviceLogger.info(
      `Log level of tenderly service set to: ${serviceLogger.settings.minLevel}`,
    );

    const pjson = require("../../package.json");
    logger.info("@tenderly/hardhat-tenderly version:", pjson.version);

    logger.info("Tenderly running configuration: ", {
      username: hre.config.tenderly?.username,
      project: hre.config.tenderly?.project,
      automaticVerification: process.env.AUTOMATIC_VERIFICATION_ENABLED,
      privateVerification: hre.config.tenderly?.privateVerification,
      networkName: hre.network.name,
    });

    extendProvider(hre);
    populateNetworks();
    if (process.env.AUTOMATIC_VERIFICATION_ENABLED === "true") {
      logger.debug(
        "Automatic verification is enabled, proceeding to extend ethers library.",
      );
      extendEthers(hre);
      extendUpgrades(hre);
      extendHardhatDeploy(hre);
      logger.debug("Wrapping ethers library finished.");
    }

    if (shouldPopulateHardhatVerifyConfig(hre)) {
      logger.info(
        "Automatic population of hardhat-verify `etherscan` configuration is enabled.",
      );
      // If the config already exists, we should not overwrite it, either remove it or turn off automatic population.
      const etherscanConfig = await findEtherscanConfig(hre);
      if (etherscanConfig !== undefined) {
        throw new Error(
          `Hardhat-verify's 'etherscan' configuration with network '${
            hre.network.name
          }' is already populated. Please remove the following configuration:\n${JSON.stringify(
            etherscanConfig,
            null,
            2,
          )}\nOr set 'TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG' environment variable to 'false'`,
        );
      }
      await populateHardhatVerifyConfig(hre);
    }

    logger.debug("Setup finished.");
  });
}

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
  hre.tenderly = lazyObject(() => new Tenderly(hre));
  extendProvider(hre);
  populateNetworks();
});

extendConfig((resolvedConfig: HardhatConfig) => {
  resolvedConfig.networks.tenderly = {
    ...resolvedConfig.networks.tenderly,
  };
});

const extendProvider = (hre: HardhatRuntimeEnvironment): void => {
  if (!isTenderlyNetworkConfig(hre.network.config)) {
    logger.info(
      `Used network is not 'tenderly' so there is no extending of the provider.`,
    );
    return;
  }

  if ("url" in hre.network.config && hre.network.config.url !== undefined) {
    if (hre.network.config.url.includes("devnet")) {
      const devnetID = hre.network.config.url.split("/").pop();
      hre.tenderly.network().setDevnetID(devnetID);
      logger.info(
        `There is a devnet url in the '${hre.network.name}' network`,
        { devnetID },
      );
      return;
    }
    const forkID = hre.network.config.url.split("/").pop();
    hre.tenderly.network().setFork(forkID);
    logger.info(`There is a fork url in the 'tenderly' network`, { forkID });
    return;
  }

  const tenderlyNetwork = new TenderlyNetwork(hre);
  tenderlyNetwork
    .initializeFork()
    .then(async (_) => {
      hre.tenderly.setNetwork(tenderlyNetwork);
      const forkID = await hre.tenderly.network().getForkID();
      (
        hre.network.config as HttpNetworkConfig
      ).url = `${TENDERLY_JSON_RPC_BASE_URL}/fork/${forkID ?? ""}`;
      // hre.ethers.provider = new hre.ethers.BrowserProvider(hre.tenderly.network());
    })
    .catch((_) => {
      logger.error(
        `Error happened while trying to initialize fork ${PLUGIN_NAME}. Check your tenderly configuration`,
      );
    });
};

const populateNetworks = (): void => {
  tenderlyService
    .getNetworks()
    .then((networks: TenderlyNetworkInterface[]) => {
      let network: TenderlyNetworkInterface;
      let slug: string;
      for (network of networks) {
        NETWORK_NAME_CHAIN_ID_MAP[network.slug] = network.ethereum_network_id;

        if (network?.metadata?.slug !== undefined) {
          NETWORK_NAME_CHAIN_ID_MAP[network.metadata.slug] =
            network.ethereum_network_id;
        }

        CHAIN_ID_NETWORK_NAME_MAP[network.ethereum_network_id] = network.slug;

        for (slug of network.metadata.secondary_slugs) {
          NETWORK_NAME_CHAIN_ID_MAP[slug] = network.ethereum_network_id;
        }
      }
      logger.silly(
        "Obtained supported public networks: ",
        NETWORK_NAME_CHAIN_ID_MAP,
      );
    })
    .catch((_) => {
      logger.error("Error encountered while fetching public networks");
    });
};

const extendEthers = (hre: HardhatRuntimeEnvironment): void => {
  if (
    "ethers" in hre &&
    hre.ethers !== undefined &&
    hre.ethers !== null &&
    "tenderly" in hre &&
    hre.tenderly !== undefined
  ) {
    Object.assign(
      hre.ethers,
      wrapEthers(
        hre.ethers as unknown as typeof ethers & HardhatEthersHelpers,
        hre.tenderly,
      ) as unknown as typeof hre.ethers,
    );
  }
};

const extendUpgrades = (hre: HardhatRuntimeEnvironment): void => {
  if (
    "upgrades" in hre &&
    hre.upgrades !== undefined &&
    hre.upgrades !== null &&
    "tenderly" in hre &&
    hre.tenderly !== undefined
  ) {
    logger.debug("Extending upgrades library");
    Object.assign(
      hre.upgrades,
      wrapUpgrades(
        hre,
        hre.upgrades as unknown as typeof upgrades & HardhatEthersHelpers,
        hre.tenderly,
      ) as unknown as typeof hre.upgrades,
    );
  }
};

// Returns true if the user has selected automatic population of hardhat-verify `etherscan` configuration through the TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG env variable,
// and the network is some of the Tenderly networks.
function shouldPopulateHardhatVerifyConfig(
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

// populateHardhatVerifyConfig will populate `hre.config.etherscan` configuration of the `@nomicfoundation/hardhat-verify` plugin.
// This function should import `@nomicfoundation/hardhat-verify` type declaration expansion of the `HardhatConfig`, but can't since there will be double overloading task error if the client application also uses `@nomicfoundation/hardhat-verify` plugin.
async function populateHardhatVerifyConfig(
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

function isRecord(value: any): value is Record<string, string> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getChainId(network: Network): Promise<number> {
  if (network.config.chainId !== undefined && network.config.chainId !== null) {
    return network.config.chainId;
  }

  return Number(await network.provider.send("eth_chainId", []));
}

async function findEtherscanConfig(
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

const extendHardhatDeploy = (hre: HardhatRuntimeEnvironment): void => {
  // ts-ignore is needed here because we want to avoid importing hardhat-deploy in order not to cause duplicated initialization of the .deployments field
  if (
    "deployments" in hre &&
    // @ts-ignore
    hre.deployments !== undefined &&
    "tenderly" in hre &&
    // @ts-ignore
    hre.tenderly !== undefined
  ) {
    // @ts-ignore
    hre.deployments = wrapHHDeployments(hre.deployments, hre.tenderly);
  }
};
