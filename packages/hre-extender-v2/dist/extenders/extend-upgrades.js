"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapUpgrades = exports.extendUpgrades = void 0;
require("@openzeppelin/hardhat-upgrades");
const logger_1 = require("../logger");
const TdlyProxyContract_1 = require("../types/TdlyProxyContract");
function extendUpgrades(hre) {
    if ("upgrades" in hre &&
        hre.upgrades !== undefined &&
        hre.upgrades !== null &&
        "tenderly" in hre &&
        hre.tenderly !== undefined) {
        logger_1.logger.debug("Extending upgrades library");
        Object.assign(hre.upgrades, wrapUpgrades(hre, hre.upgrades, hre.tenderly));
    }
}
exports.extendUpgrades = extendUpgrades;
function wrapUpgrades(hre, nativeUpgrades, tenderly) {
    // Deploy Proxy
    nativeUpgrades.deployProxy = wrapDeployProxy(hre, nativeUpgrades.deployProxy, tenderly);
    // Deploy BeaconProxy
    nativeUpgrades.deployBeaconProxy = wrapDeployBeaconProxy(hre, nativeUpgrades.deployBeaconProxy, tenderly);
    return nativeUpgrades;
}
exports.wrapUpgrades = wrapUpgrades;
function wrapDeployProxy(hre, func, tenderly) {
    return async function (implFactory, argsOrOpts, opts) {
        logger_1.logger.debug("Calling ethers.Contract.deployProxy");
        let proxyContract;
        if (opts !== undefined && opts !== null) {
            proxyContract = await func(implFactory, argsOrOpts, opts);
        }
        else {
            proxyContract = await func(implFactory, argsOrOpts);
        }
        logger_1.logger.debug("Returning TdlyProxyContract instance");
        return new TdlyProxyContract_1.TdlyProxyContract(hre, tenderly, proxyContract);
    };
}
function wrapDeployBeaconProxy(hre, func, tenderly) {
    return async function (beacon, implFactory, argsOrOpts, opts) {
        if (isTdlyContractFactory(implFactory)) {
            implFactory = implFactory.getNativeContractFactory();
        }
        let proxyContract;
        if (opts !== undefined && opts !== null) {
            proxyContract = await func(beacon, implFactory, argsOrOpts, opts);
        }
        else {
            proxyContract = await func(beacon, implFactory, argsOrOpts);
        }
        return new TdlyProxyContract_1.TdlyProxyContract(hre, tenderly, proxyContract);
    };
}
function isTdlyContractFactory(factory) {
    return (factory.getNativeContractFactory !== undefined);
}
//# sourceMappingURL=extend-upgrades.js.map