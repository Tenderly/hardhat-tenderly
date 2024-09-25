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
import { TenderlyService } from "@tenderly/api-client";
import { Tenderly, TenderlyNetwork, VersionCompatibilityChecker } from "@tenderly/hardhat-integration";
import { extendEthers } from "./extenders/extend-ethers";
import { extendHardhatDeploy } from "./extenders/extend-hardhat-deploy";
import { isTenderlyNetworkConfig } from "./extenders/tenderly-network-resolver";

const tenderlyService = new TenderlyService(PLUGIN_NAME);

export function setup(cfg: { automaticVerifications: boolean } = { automaticVerifications: true }) {
  extendEnvironment(async (hre: HardhatRuntimeEnvironment) => {
    process.env.TENDERLY_AUTOMATIC_VERIFICATION = cfg.automaticVerifications ? "true": "false"
    process.env.AUTOMATIC_VERIFICATION_ENABLED = cfg.automaticVerifications ? "true": "false"
    const hardhatTenderlyVersion = require("../package.json").version;
    process.env.HARDHAT_TENDERLY_VERSION = hardhatTenderlyVersion;
    
    hre.tenderly = lazyObject(() => new Tenderly(hre));

    logger.info("@tenderly/hardhat-tenderly version:", hardhatTenderlyVersion);

    logger.info("Tenderly running configuration: ", {
      username: hre.config.tenderly?.username,
      project: hre.config.tenderly?.project,
      automaticVerification: process.env.AUTOMATIC_VERIFICATION_ENABLED,
      privateVerification: hre.config.tenderly?.privateVerification,
      networkName: hre.network.name,
    });
    
    // check if the ethers and hardhat-tenderly versions are compatible
    const versionCompatibilityChecker = new VersionCompatibilityChecker();
    const [areCompatible, ethersVersion] = versionCompatibilityChecker.areEthersAndHardhatTenderlyVersionsCompatible(
      hre,
      hardhatTenderlyVersion,
    );
    if (!areCompatible) {
      const compatibleHardhatTenderlyVersion = versionCompatibilityChecker.compatibleHardhatTenderlyVersionForEthersVersion(
        ethersVersion,
      );
      console.log(
        "\x1b[31m%s%s\x1b[0m",
        `Wrong '@tenderly/hardhat-tenderly' version '${hardhatTenderlyVersion}' used with ethers version '${ethersVersion}'.\n`,
        `Please use the correct version of latest '@tenderly/hardhat-tenderly@${compatibleHardhatTenderlyVersion}' plugin.\n`
      );
    }

    extendProvider(hre);
    populateNetworks();
    if (process.env.AUTOMATIC_VERIFICATION_ENABLED === "true" || process.env.TENDERLY_AUTOMATIC_VERIFICATION === "true") {
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



