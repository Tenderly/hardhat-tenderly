"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHttpNetworkConfig = exports.isTenderlyGatewayNetworkConfig = exports.isTenderlyNetworkConfig = void 0;
const isTenderlyNetworkConfig = (nw) => {
    if (nw === undefined || nw === null) {
        return false;
    }
    if (!isHttpNetworkConfig(nw)) {
        return false;
    }
    // The network belongs to tenderly if the rpc_url is one of the following:
    // - https://rpc.vnet.tenderly.co/devnet/...
    // - https://<network_name>.rpc.tenderly.co/...
    // - https://virtual.<network_name>.rpc.tenderly.co/...
    // - https://rpc.tenderly.co/...
    const regex = /^https?:\/\/(?:rpc\.vnet\.tenderly\.co\/devnet\/|(?:[\w-]+\.rpc|rpc)\.tenderly\.co\/|virtual\.[\w-]+\.rpc\.tenderly\.co\/).*$/;
    return regex.test(nw.url);
};
exports.isTenderlyNetworkConfig = isTenderlyNetworkConfig;
function isTenderlyGatewayNetworkConfig(nw) {
    if (nw === undefined || nw === null) {
        return false;
    }
    if (!isHttpNetworkConfig(nw)) {
        return false;
    }
    const regex = /^https?:\/\/[\w-]+\.gateway\.tenderly\.co\/.*$/;
    return regex.test(nw.url);
}
exports.isTenderlyGatewayNetworkConfig = isTenderlyGatewayNetworkConfig;
function isHttpNetworkConfig(config) {
    return config.url !== undefined;
}
exports.isHttpNetworkConfig = isHttpNetworkConfig;
//# sourceMappingURL=tenderly-network-resolver.js.map