import "@openzeppelin/hardhat-upgrades";
import { Contract, ContractFactory } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { HardhatEthersHelpers } from "@nomicfoundation/hardhat-ethers/types";
import { upgrades } from "hardhat";
import { ContractAddressOrInstance, DeployBeaconProxyOptions, DeployProxyOptions } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { TenderlyPlugin } from "@tenderly/hardhat-integration";
export declare function extendUpgrades(hre: HardhatRuntimeEnvironment): void;
export declare function wrapUpgrades(hre: HardhatRuntimeEnvironment, nativeUpgrades: typeof upgrades & HardhatEthersHelpers, tenderly: TenderlyPlugin): typeof upgrades & HardhatEthersHelpers;
export interface DeployFunction {
    (ImplFactory: ContractFactory, args?: unknown[], opts?: DeployProxyOptions): Promise<Contract>;
    (ImplFactory: ContractFactory, opts?: DeployProxyOptions): Promise<Contract>;
}
export interface DeployBeaconProxyFunction {
    (beacon: ContractAddressOrInstance, attachTo: ContractFactory, args?: unknown[], opts?: DeployBeaconProxyOptions): Promise<Contract>;
    (beacon: ContractAddressOrInstance, attachTo: ContractFactory, opts?: DeployBeaconProxyOptions): Promise<Contract>;
}
//# sourceMappingURL=extend-upgrades.d.ts.map