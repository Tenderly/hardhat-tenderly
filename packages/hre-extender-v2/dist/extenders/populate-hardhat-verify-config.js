"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findEtherscanConfig = exports.populateHardhatVerifyConfig = exports.shouldPopulateHardhatVerifyConfig = void 0;
const tenderly_network_resolver_1 = require("./tenderly-network-resolver");
const config_1 = require("@tenderly/api-client/utils/config");
const logger_1 = require("../logger");
const vnet_type_1 = require("@tenderly/hardhat-integration/dist/tenderly/vnet-type");
const URLComposer = __importStar(require("@tenderly/hardhat-integration/dist/utils/url-composer"));
function shouldPopulateHardhatVerifyConfig(hre) {
    return (
    // Must cover both since AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG is the legacy because we didn't use the TENDERLY_ prefix.
    (process.env.TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG === "true" ||
        process.env.AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG === "true") &&
        ((0, tenderly_network_resolver_1.isTenderlyNetworkConfig)(hre.network.config) ||
            (0, tenderly_network_resolver_1.isTenderlyGatewayNetworkConfig)(hre.network.config)) &&
        (0, tenderly_network_resolver_1.isHttpNetworkConfig)(hre.network.config));
}
exports.shouldPopulateHardhatVerifyConfig = shouldPopulateHardhatVerifyConfig;
//
// populateHardhatVerifyConfig will populate `hre.config.etherscan` configuration of the `@nomicfoundation/hardhat-verify` plugin.
// This function should import `@nomicfoundation/hardhat-verify` type declaration expansion of the `HardhatConfig`, but can't since there will be double overloading task error if the client application also uses `@nomicfoundation/hardhat-verify` plugin.
async function populateHardhatVerifyConfig(hre) {
    if ((!(0, tenderly_network_resolver_1.isTenderlyNetworkConfig)(hre.network.config) &&
        !(0, tenderly_network_resolver_1.isTenderlyGatewayNetworkConfig)(hre.network.config)) ||
        !(0, tenderly_network_resolver_1.isHttpNetworkConfig)(hre.network.config)) {
        return;
    }
    const accessKey = (0, config_1.getAccessToken)();
    if (accessKey === "") {
        logger_1.logger.error("Tenderly access key is not set. Please set TENDERLY_ACCESS_KEY environment variable.");
        return;
    }
    if (hre.config.etherscan === undefined ||
        hre.config.etherscan === null) {
        hre.config.etherscan = {
            apiKey: accessKey,
            customChains: [],
        };
    }
    if (isRecord(hre.config.etherscan.apiKey) &&
        hre.config.etherscan.apiKey[hre.network.name] === undefined) {
        hre.config.etherscan.apiKey[hre.network.name] = accessKey;
    }
    else if (typeof hre.config.etherscan.apiKey === "string") {
        hre.config.etherscan.apiKey = accessKey;
    }
    const chainId = await getChainId(hre.network);
    const endpointId = hre.network.config.url.split("/").pop();
    if (endpointId === undefined) {
        throw new Error("Could not locate the UUID at the end of a Tenderly RPC URL.");
    }
    const vnetType = await (0, vnet_type_1.getVnetTypeByEndpointId)(hre, endpointId);
    if (vnetType === vnet_type_1.VnetType.NULL_TYPE) {
        throw new Error("Couldn't recognize VnetType from endpoint id.");
    }
    hre.config.etherscan.customChains.push({
        network: hre.network.name,
        chainId,
        urls: {
            apiURL: URLComposer.composeApiURL(hre, endpointId, chainId, vnetType),
            browserURL: URLComposer.composeBrowserURL(hre, endpointId, chainId, vnetType),
        },
    });
}
exports.populateHardhatVerifyConfig = populateHardhatVerifyConfig;
async function findEtherscanConfig(hre) {
    if (hre.config.etherscan === undefined) {
        return undefined;
    }
    if (hre.config.etherscan.customChains === undefined) {
        return undefined;
    }
    return hre.config.etherscan.customChains.find((chainConfig) => {
        return chainConfig.network === hre.network.name;
    });
}
exports.findEtherscanConfig = findEtherscanConfig;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
async function getChainId(network) {
    if (network.config.chainId !== undefined && network.config.chainId !== null) {
        return network.config.chainId;
    }
    return Number(await network.provider.send("eth_chainId", []));
}
//# sourceMappingURL=populate-hardhat-verify-config.js.map