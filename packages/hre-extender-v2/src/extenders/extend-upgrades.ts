import "@openzeppelin/hardhat-upgrades";
import { Contract, ContractFactory, ethers } from "ethers";
import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";
import {
  Libraries,
  FactoryOptions,
  HardhatEthersHelpers,
  DeployContractOptions,
} from "@nomicfoundation/hardhat-ethers/types";

import { upgrades } from "hardhat";
import {
  ContractAddressOrInstance,
  DeployBeaconProxyOptions,
  DeployProxyOptions,
} from "@openzeppelin/hardhat-upgrades/dist/utils";
import { TenderlyPlugin } from "@tenderly/hardhat-tenderly";
import { logger } from "../logger";
import { TdlyContractFactory } from "../types/TdlyContractFactory";
import { TdlyProxyContract } from "../types/TdlyProxyContract";

export function extendUpgrades(hre: HardhatRuntimeEnvironment): void {
  if (
    "upgrades" in hre &&
    hre.upgrades !== undefined &&
    hre.upgrades !== null &&
    "tenderly" in hre &&
    hre.tenderly !== undefined
  ) {
    logger.debug("Extending upgrades library");
    Object.assign(
      hre.upgrades,
      wrapUpgrades(
        hre,
        hre.upgrades as unknown as typeof upgrades & HardhatEthersHelpers,
        hre.tenderly,
      ) as unknown as typeof hre.upgrades,
    );
  }
}

export function wrapUpgrades(
  hre: HardhatRuntimeEnvironment,
  nativeUpgrades: typeof upgrades & HardhatEthersHelpers,
  tenderly: TenderlyPlugin,
): typeof upgrades & HardhatEthersHelpers {
  // Deploy Proxy
  nativeUpgrades.deployProxy = wrapDeployProxy(
    hre,
    nativeUpgrades.deployProxy,
    tenderly,
  ) as typeof nativeUpgrades.deployProxy;

  // Deploy BeaconProxy
  nativeUpgrades.deployBeaconProxy = wrapDeployBeaconProxy(
    hre,
    nativeUpgrades.deployBeaconProxy,
    tenderly,
  ) as typeof nativeUpgrades.deployBeaconProxy;

  return nativeUpgrades;
}

export interface DeployFunction {
  (
    ImplFactory: ContractFactory,
    args?: unknown[],
    opts?: DeployProxyOptions,
  ): Promise<Contract>;
  (ImplFactory: ContractFactory, opts?: DeployProxyOptions): Promise<Contract>;
}

function wrapDeployProxy(
  hre: HardhatRuntimeEnvironment,
  func: DeployFunction,
  tenderly: TenderlyPlugin,
): DeployFunction {
  return async function (
    implFactory: ContractFactory,
    argsOrOpts?: unknown[] | DeployProxyOptions,
    opts?: DeployProxyOptions,
  ) {
    logger.debug("Calling ethers.Contract.deployProxy");
    let proxyContract;
    if (opts !== undefined && opts !== null) {
      proxyContract = await func(implFactory, argsOrOpts as unknown[], opts);
    } else {
      proxyContract = await func(implFactory, argsOrOpts as DeployProxyOptions);
    }

    logger.debug("Returning TdlyProxyContract instance");
    return new TdlyProxyContract(
      hre,
      tenderly,
      proxyContract,
    ) as unknown as ethers.Contract;
  };
}

export interface DeployBeaconProxyFunction {
  (
    beacon: ContractAddressOrInstance,
    attachTo: ContractFactory,
    args?: unknown[],
    opts?: DeployBeaconProxyOptions,
  ): Promise<Contract>;
  (
    beacon: ContractAddressOrInstance,
    attachTo: ContractFactory,
    opts?: DeployBeaconProxyOptions,
  ): Promise<Contract>;
}

function wrapDeployBeaconProxy(
  hre: HardhatRuntimeEnvironment,
  func: DeployBeaconProxyFunction,
  tenderly: TenderlyPlugin,
): DeployBeaconProxyFunction {
  return async function (
    beacon: ContractAddressOrInstance,
    implFactory: ContractFactory,
    argsOrOpts?: unknown[] | DeployBeaconProxyOptions,
    opts?: DeployBeaconProxyOptions,
  ): Promise<Contract> {
    if (isTdlyContractFactory(implFactory)) {
      implFactory = implFactory.getNativeContractFactory();
    }

    let proxyContract;
    if (opts !== undefined && opts !== null) {
      proxyContract = await func(
        beacon,
        implFactory,
        argsOrOpts as unknown[],
        opts,
      );
    } else {
      proxyContract = await func(
        beacon,
        implFactory,
        argsOrOpts as DeployBeaconProxyOptions,
      );
    }

    return new TdlyProxyContract(
      hre,
      tenderly,
      proxyContract,
    ) as unknown as ethers.Contract;
  };
}

function isTdlyContractFactory(
  factory: ContractFactory | TdlyContractFactory,
): factory is TdlyContractFactory {
  return (
    (factory as TdlyContractFactory).getNativeContractFactory !== undefined
  );
}

