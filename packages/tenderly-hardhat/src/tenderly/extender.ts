import { ethers } from "ethers";
import { lazyObject } from "hardhat/plugins";
import { extendConfig, extendEnvironment } from "hardhat/config";
import { HardhatRuntimeEnvironment, HttpNetworkConfig, HardhatConfig } from "hardhat/types";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";
import { TenderlyService } from "tenderly";
import { TenderlyNetwork as TenderlyNetworkInterface } from "tenderly/types";
import {
  CHAIN_ID_NETWORK_NAME_MAP,
  NETWORK_NAME_CHAIN_ID_MAP,
  TENDERLY_JSON_RPC_BASE_URL,
} from "tenderly/common/constants";

import { Tenderly } from "../Tenderly";
import { TenderlyNetwork } from "../TenderlyNetwork";
import { PLUGIN_NAME } from "../constants";
import { wrapEthers } from "./ethers";
import { wrapHHDeployments } from "./hardhat-deploy";

const tenderlyService = new TenderlyService(PLUGIN_NAME);

export function setup() {
  extendEnvironment((hre: HardhatRuntimeEnvironment) => {
    hre.tenderly = lazyObject(() => new Tenderly(hre));
    extendProvider(hre);
    populateNetworks();
    if (process.env.AUTOMATIC_VERIFICATION_ENABLED === "true") {
      extendEthers(hre);
      extendHardhatDeploy(hre);
    }
  });
}

extendConfig((resolvedConfig: HardhatConfig) => {
  resolvedConfig.networks.tenderly = {
    ...resolvedConfig.networks.tenderly,
  };
});

const extendProvider = (hre: HardhatRuntimeEnvironment): void => {
  if (hre.network.name !== "tenderly") {
    return;
  }

  if ("url" in hre.network.config && hre.network.config.url !== undefined) {
    const forkID = hre.network.config.url.split("/").pop();
    hre.tenderly.network().setFork(forkID);
    return;
  }

  const tenderlyNetwork = new TenderlyNetwork(hre);
  tenderlyNetwork
    .initializeFork()
    .then(async (_) => {
      hre.tenderly.setNetwork(tenderlyNetwork);
      const forkID = await hre.tenderly.network().getForkID();
      (hre.network.config as HttpNetworkConfig).url = `${TENDERLY_JSON_RPC_BASE_URL}/fork/${forkID ?? ""}`;
      hre.ethers.provider = new hre.ethers.providers.Web3Provider(hre.tenderly.network());
    })
    .catch((_) => {
      console.log(`Error in ${PLUGIN_NAME}: Initializing fork, check your tenderly configuration`);
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
          NETWORK_NAME_CHAIN_ID_MAP[network.metadata.slug] = network.ethereum_network_id;
        }

        CHAIN_ID_NETWORK_NAME_MAP[network.ethereum_network_id] = network.slug;

        for (slug of network.metadata.secondary_slugs) {
          NETWORK_NAME_CHAIN_ID_MAP[slug] = network.ethereum_network_id;
        }
      }
    })
    .catch((_) => {
      console.log("Error encountered while fetching public networks");
    });
};

const extendEthers = (hre: HardhatRuntimeEnvironment): void => {
  if ("ethers" in hre && hre.ethers !== undefined && "tenderly" in hre && hre.tenderly !== undefined) {
    Object.assign(
      hre.ethers,
      wrapEthers(
        hre.ethers as unknown as typeof ethers & HardhatEthersHelpers,
        hre.tenderly
      ) as unknown as typeof hre.ethers
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
