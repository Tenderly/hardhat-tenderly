"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = void 0;
const plugins_1 = require("hardhat/plugins");
const config_1 = require("hardhat/config");
const constants_1 = require("@tenderly/api-client/common/constants");
const logger_1 = require("./logger");
const api_client_1 = require("@tenderly/api-client");
const hardhat_integration_1 = require("@tenderly/hardhat-integration");
const extend_ethers_1 = require("./extenders/extend-ethers");
const extend_hardhat_deploy_1 = require("./extenders/extend-hardhat-deploy");
const tenderly_network_resolver_1 = require("./extenders/tenderly-network-resolver");
const tenderlyService = new api_client_1.TenderlyService(constants_1.PLUGIN_NAME);
function setup() {
    (0, config_1.extendEnvironment)(async (hre) => {
        hre.tenderly = (0, plugins_1.lazyObject)(() => new hardhat_integration_1.Tenderly(hre));
        const pjson = require("../package.json");
        logger_1.logger.info("@tenderly/hardhat-tenderly version:", pjson.version);
        logger_1.logger.info("Tenderly running configuration: ", {
            username: hre.config.tenderly?.username,
            project: hre.config.tenderly?.project,
            automaticVerification: process.env.AUTOMATIC_VERIFICATION_ENABLED,
            privateVerification: hre.config.tenderly?.privateVerification,
            networkName: hre.network.name,
        });
        extendProvider(hre);
        populateNetworks();
        if (process.env.AUTOMATIC_VERIFICATION_ENABLED === "true" || process.env.TENDERLY_AUTOMATIC_VERIFICATION === "true") {
            logger_1.logger.debug("Automatic verification is enabled, proceeding to extend ethers library.");
            (0, extend_ethers_1.extendEthers)(hre);
            (0, extend_hardhat_deploy_1.extendHardhatDeploy)(hre);
            logger_1.logger.debug("Wrapping ethers library finished.");
        }
        logger_1.logger.debug("Setup finished.");
    });
}
exports.setup = setup;
(0, config_1.extendEnvironment)((hre) => {
    hre.tenderly = (0, plugins_1.lazyObject)(() => new hardhat_integration_1.Tenderly(hre));
    extendProvider(hre);
    populateNetworks();
});
(0, config_1.extendConfig)((resolvedConfig) => {
    resolvedConfig.networks.tenderly = {
        ...resolvedConfig.networks.tenderly,
    };
});
const extendProvider = (hre) => {
    if (!(0, tenderly_network_resolver_1.isTenderlyNetworkConfig)(hre.network.config)) {
        logger_1.logger.info(`Used network is not 'tenderly' so there is no extending of the provider.`);
        return;
    }
    if ("url" in hre.network.config && hre.network.config.url !== undefined) {
        if (hre.network.config.url.includes("devnet")) {
            const devnetID = hre.network.config.url.split("/").pop();
            hre.tenderly.network().setDevnetID(devnetID);
            logger_1.logger.info(`There is a devnet url in the '${hre.network.name}' network`, { devnetID });
            return;
        }
        const forkID = hre.network.config.url.split("/").pop();
        hre.tenderly.network().setFork(forkID);
        logger_1.logger.info(`There is a fork url in the 'tenderly' network`, { forkID });
        return;
    }
    const tenderlyNetwork = new hardhat_integration_1.TenderlyNetwork(hre);
    tenderlyNetwork
        .initializeFork()
        .then(async (_) => {
        hre.tenderly.setNetwork(tenderlyNetwork);
        const forkID = await hre.tenderly.network().getForkID();
        hre.network.config.url = `${constants_1.TENDERLY_JSON_RPC_BASE_URL}/fork/${forkID ?? ""}`;
        // hre.ethers.provider = new hre.ethers.BrowserProvider(hre.tenderly.network());
    })
        .catch((_) => {
        logger_1.logger.error(`Error happened while trying to initialize fork ${constants_1.PLUGIN_NAME}. Check your tenderly configuration`);
    });
};
const populateNetworks = () => {
    tenderlyService
        .getNetworks()
        .then((networks) => {
        let network;
        let slug;
        for (network of networks) {
            constants_1.NETWORK_NAME_CHAIN_ID_MAP[network.slug] = network.ethereum_network_id;
            if (network?.metadata?.slug !== undefined) {
                constants_1.NETWORK_NAME_CHAIN_ID_MAP[network.metadata.slug] =
                    network.ethereum_network_id;
            }
            constants_1.CHAIN_ID_NETWORK_NAME_MAP[network.ethereum_network_id] = network.slug;
            for (slug of network.metadata.secondary_slugs) {
                constants_1.NETWORK_NAME_CHAIN_ID_MAP[slug] = network.ethereum_network_id;
            }
        }
        logger_1.logger.silly("Obtained supported public networks: ", constants_1.NETWORK_NAME_CHAIN_ID_MAP);
    })
        .catch((_) => {
        logger_1.logger.error("Error encountered while fetching public networks");
    });
};
//# sourceMappingURL=setup.js.map