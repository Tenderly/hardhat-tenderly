"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TdlyProxyContract = void 0;
class TdlyProxyContract {
    constructor(hre, tenderly, proxyContract) {
        this.hre = hre;
        this.tenderly = tenderly;
        this.proxyContract = proxyContract;
    }
    async waitForDeployment() {
        const proxyContract = await this.proxyContract.waitForDeployment();
        const deploymentTransaction = this.proxyContract.deploymentTransaction();
        if (deploymentTransaction !== undefined && deploymentTransaction !== null) {
            // verify:verify task should verify the proxy (regardless of proxy type), implementation and all the related contracts.
            // logger.debug("Running hardhat-verify's verify task ");
            await this.hre.run("verify:verify", {
                address: await proxyContract.getAddress(),
                constructorArguments: [],
            });
        }
        return proxyContract;
    }
    deploymentTransaction() {
        return this.proxyContract.deploymentTransaction();
    }
    async getAddress() {
        return this.nativeContract.getAddress();
    }
}
exports.TdlyProxyContract = TdlyProxyContract;
//# sourceMappingURL=TdlyProxyContract.js.map