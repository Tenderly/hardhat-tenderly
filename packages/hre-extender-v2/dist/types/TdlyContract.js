"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TdlyContract = void 0;
class TdlyContract {
    constructor(nativeContract, tenderly, contractName, libs) {
        this.contractName = contractName;
        this.nativeContract = nativeContract;
        this.tenderly = tenderly;
        this.libraries = libs;
        Object.keys(nativeContract).forEach((key) => {
            if (this[key] !== undefined) {
                return;
            }
            if (key === "deploymentTransaction") {
                const deploymentTransaction = nativeContract[key]();
                if (deploymentTransaction === undefined ||
                    deploymentTransaction === null) {
                    return;
                }
                const wait = deploymentTransaction.wait;
                deploymentTransaction.wait = async (confirmations) => {
                    const receipt = await wait(confirmations);
                    if (receipt === undefined || receipt === null) {
                        return null;
                    }
                    if (receipt.contractAddress === undefined ||
                        receipt.contractAddress === null) {
                        return receipt;
                    }
                    await this._tdlyVerify(receipt.contractAddress);
                    return receipt;
                };
            }
            this[key] = nativeContract[key];
        });
    }
    async waitForDeployment() {
        const contract = await this.nativeContract.waitForDeployment();
        const deploymentTransaction = this.nativeContract.deploymentTransaction();
        if (deploymentTransaction !== undefined && deploymentTransaction !== null) {
            await this._tdlyVerify(await contract.getAddress());
        }
        return contract;
    }
    deploymentTransaction() {
        return this.nativeContract.deploymentTransaction();
    }
    async getAddress() {
        return this.nativeContract.getAddress();
    }
    async _tdlyVerify(address) {
        const contPair = {
            name: this.contractName,
            address,
        };
        if (this.libraries !== undefined && this.libraries !== null) {
            contPair.libraries = this.libraries;
        }
        await this.tenderly.persistArtifacts(contPair);
        await this.tenderly.verify(contPair);
    }
}
exports.TdlyContract = TdlyContract;
//# sourceMappingURL=TdlyContract.js.map