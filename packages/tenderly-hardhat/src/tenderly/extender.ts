import "@nomicfoundation/hardhat-ethers";
import { lazyObject } from "hardhat/plugins";
import { extendConfig, extendEnvironment } from "hardhat/config";
import {
  HardhatRuntimeEnvironment,
  HttpNetworkConfig,
  HardhatConfig,
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
import { logger } from "../utils/logger";
import { Tenderly } from "../Tenderly";
import { TenderlyNetwork } from "../TenderlyNetwork";
import { PLUGIN_NAME } from "../constants";
import { isTenderlyNetworkConfig } from "../utils/util";
import { wrapEthers } from "./ethers";
import { wrapHHDeployments } from "./hardhat-deploy";

const tenderlyService = new TenderlyService(PLUGIN_NAME);

export function setup() {
  // set to loggers to error level by default
  logger.settings.minLevel = 4;
  serviceLogger.settings.minLevel = 4;

  extendEnvironment((hre: HardhatRuntimeEnvironment) => {
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
      extendHardhatDeploy(hre);
      logger.debug("Wrapping ethers library finished.");
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
      (hre.network.config as HttpNetworkConfig).url =
        `${TENDERLY_JSON_RPC_BASE_URL}/fork/${forkID ?? ""}`;
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
