import "@openzeppelin/hardhat-upgrades";
import { lazyObject } from "hardhat/plugins";
import { extendConfig, extendEnvironment } from "hardhat/config";
import {
  HardhatRuntimeEnvironment,
  HttpNetworkConfig,
  HardhatConfig,
} from "hardhat/types";
import {
  CHAIN_ID_NETWORK_NAME_MAP,
  NETWORK_NAME_CHAIN_ID_MAP, PLUGIN_NAME,
  TENDERLY_JSON_RPC_BASE_URL,
} from "@tenderly/api-client/common/constants";

import{ TenderlyNetwork as TenderlyNetworkInterface } from "@tenderly/api-client/types";

import { logger } from "./logger";
import { TenderlyService } from"@tenderly/api-client";
import { Tenderly, TenderlyNetwork } from "@tenderly/hardhat-integration";
import { extendEthers } from "./extenders/extend-ethers";
import { extendUpgrades } from "./extenders/extend-upgrades";
import { extendHardhatDeploy } from "./extenders/extend-hardhat-deploy";
import { isTenderlyNetworkConfig } from "./extenders/tenderly-network-resolver";
import {
  findEtherscanConfig,
  populateHardhatVerifyConfig,
  shouldPopulateHardhatVerifyConfig,
} from "./extenders/populate-hardhat-verify-config";

const tenderlyService = new TenderlyService(PLUGIN_NAME);

export function setup(cfg: { automaticVerifications: boolean } = { automaticVerifications: true }) {
  extendEnvironment(async (hre: HardhatRuntimeEnvironment) => {
    process.env.TENDERLY_AUTOMATIC_VERIFICATION = cfg.automaticVerifications ? "true": "false"
    process.env.AUTOMATIC_VERIFICATION_ENABLED = cfg.automaticVerifications ? "true": "false"
    process.env.HARDHAT_TENDERLY_VERSION = require("../package.json").version;
    
    hre.tenderly = lazyObject(() => new Tenderly(hre));

    const pjson = require("../package.json");
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
    if (process.env.AUTOMATIC_VERIFICATION_ENABLED === "true" || process.env.TENDERLY_AUTOMATIC_VERIFICATION === "true") {
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



