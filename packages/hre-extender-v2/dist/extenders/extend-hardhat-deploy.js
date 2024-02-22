"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapHHDeployments = exports.extendHardhatDeploy = void 0;
function extendHardhatDeploy(hre) {
    // ts-ignore is needed here because we want to avoid importing hardhat-deploy in order not to cause duplicated initialization of the .deployments field
    if ("deployments" in hre &&
        // @ts-ignore
        hre.deployments !== undefined &&
        "tenderly" in hre &&
        // @ts-ignore
        hre.tenderly !== undefined) {
        // @ts-ignore
        hre.deployments = wrapHHDeployments(hre.deployments, hre.tenderly);
    }
}
exports.extendHardhatDeploy = extendHardhatDeploy;
function wrapHHDeployments(deployments, tenderly) {
    deployments.deploy = wrapDeploy(deployments.deploy, tenderly);
    return deployments;
}
exports.wrapHHDeployments = wrapHHDeployments;
function wrapDeploy(deployFunc, tenderly) {
    return async function (name, options) {
        const depResult = await deployFunc(name, options);
        await tenderly.verify({
            name,
            address: depResult.address,
        });
        return depResult;
    };
}
//# sourceMappingURL=extend-hardhat-deploy.js.map