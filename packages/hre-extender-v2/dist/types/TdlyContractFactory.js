"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TdlyContractFactory = void 0;
const TdlyContract_1 = require("./TdlyContract");
class TdlyContractFactory {
    constructor(nativeContractFactory, tenderly, contractName, libs) {
        this.nativeContractFactory = nativeContractFactory;
        this.tenderly = tenderly;
        this.contractName = contractName;
        this.libs = libs;
        for (const attribute in Object.assign(nativeContractFactory)) {
            if (this[attribute] !== undefined) {
                continue;
            }
            this[attribute] = nativeContractFactory[attribute];
        }
        classFunctions(nativeContractFactory).forEach((funcName) => {
            if (this[funcName] !== undefined) {
                return;
            }
            this[funcName] = nativeContractFactory[funcName];
        });
    }
    async deploy(...args) {
        const contract = await this.nativeContractFactory.deploy(...args);
        return new TdlyContract_1.TdlyContract(contract, this.tenderly, this.contractName, this.libs);
    }
    connect(signer) {
        const contractFactory = this.nativeContractFactory.connect(signer);
        return new TdlyContractFactory(contractFactory, this.tenderly, this.contractName, this.libs);
    }
    getLibs() {
        return this.libs;
    }
    getContractName() {
        return this.contractName;
    }
    getNativeContractFactory() {
        return this.nativeContractFactory;
    }
}
exports.TdlyContractFactory = TdlyContractFactory;
const classFunctions = (x) => distinctDeepFunctions(x).filter((name) => name !== "constructor" && name.indexOf("__") === -1);
const distinctDeepFunctions = (x) => Array.from(new Set(deepFunctions(x)));
const deepFunctions = (x) => {
    if (x && x !== Object.prototype) {
        return Object.getOwnPropertyNames(x)
            .filter((name) => isGetter(x, name) !== null || isFunction(x, name))
            .concat(deepFunctions(Object.getPrototypeOf(x)) ?? []);
    }
    return [];
};
const isGetter = (x, name) => (Object.getOwnPropertyDescriptor(x, name) !== null || {}).get;
const isFunction = (x, name) => typeof x[name] === "function";
//# sourceMappingURL=TdlyContractFactory.js.map