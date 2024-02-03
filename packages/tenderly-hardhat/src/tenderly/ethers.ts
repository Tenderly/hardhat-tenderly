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
import { TenderlyPlugin } from "../type-extensions";
import { logger } from "../utils/logger";
import { TdlyContractFactory } from "./ethers/ContractFactory";
import { TdlyContract } from "./ethers/Contract";
import { TdlyProxyContract } from "./ethers/ProxyContract";

export function wrapEthers(
  nativeEthers: typeof ethers & HardhatEthersHelpers,
  tenderly: TenderlyPlugin,
): typeof ethers & HardhatEthersHelpers {
  // Factory
  nativeEthers.getContractFactoryFromArtifact =
    wrapGetContractFactoryFromArtifact(
      nativeEthers.getContractFactoryFromArtifact,
      tenderly,
    ) as typeof nativeEthers.getContractFactoryFromArtifact;
  nativeEthers.getContractFactory = wrapGetContractFactory(
    nativeEthers.getContractFactory,
    tenderly,
  ) as typeof nativeEthers.getContractFactory;

  // Ethers's deployContract
  nativeEthers.deployContract = wrapDeployContract(
    nativeEthers.deployContract,
    tenderly,
  ) as typeof nativeEthers.deployContract;

  // Contract
  nativeEthers.getContractAtFromArtifact = wrapGetContractAtFromArtifact(
    nativeEthers.getContractAtFromArtifact,
    tenderly,
  ) as typeof nativeEthers.getContractAtFromArtifact;
  nativeEthers.getContractAt = wrapGetContractAt(
    nativeEthers.getContractAt,
    tenderly,
  ) as typeof nativeEthers.getContractAt;

  return nativeEthers;
}

export function wrapUpgrades(
  hre: HardhatRuntimeEnvironment,
  nativeUpgrades: typeof upgrades & HardhatEthersHelpers,
  tenderly: TenderlyPlugin
): typeof upgrades & HardhatEthersHelpers {
  // Deploy Proxy
  nativeUpgrades.deployProxy = wrapDeployProxy(
    hre,
    nativeUpgrades.deployProxy,
    tenderly
  ) as typeof nativeUpgrades.deployProxy;
  nativeUpgrades.deployBeaconProxy = wrapDeployBeaconProxy(
    hre,
    nativeUpgrades.deployBeaconProxy,
    tenderly
  ) as typeof nativeUpgrades.deployBeaconProxy;

  return nativeUpgrades;
}

export interface DeployFunction {
  (ImplFactory: ContractFactory, args?: unknown[], opts?: DeployProxyOptions): Promise<Contract>;
  (ImplFactory: ContractFactory, opts?: DeployProxyOptions): Promise<Contract>;
}

function wrapDeployProxy(
  hre: HardhatRuntimeEnvironment,
  func: DeployFunction,
  tenderly: TenderlyPlugin
): DeployFunction {
  return async function (
    implFactory: ContractFactory,
    argsOrOpts?: unknown[] | DeployProxyOptions,
    opts?: DeployProxyOptions
  ) {
    logger.debug("Calling ethers.Contract.deployProxy");
    let proxyContract;
    if (opts !== undefined && opts !== null) {
      proxyContract = await func(implFactory, argsOrOpts as unknown[], opts);
    } else {
      proxyContract = await func(implFactory, argsOrOpts as DeployProxyOptions);
    }

    logger.debug("Returning TdlyProxyContract instance");
    return new TdlyProxyContract(hre, tenderly, proxyContract) as unknown as ethers.Contract;
  };
}

export interface DeployBeaconProxyFunction {
  (
    beacon: ContractAddressOrInstance,
    attachTo: ContractFactory,
    args?: unknown[],
    opts?: DeployBeaconProxyOptions
  ): Promise<Contract>;
  (beacon: ContractAddressOrInstance, attachTo: ContractFactory, opts?: DeployBeaconProxyOptions): Promise<Contract>;
}

function wrapDeployBeaconProxy(
  hre: HardhatRuntimeEnvironment,
  func: DeployBeaconProxyFunction,
  tenderly: TenderlyPlugin
): DeployBeaconProxyFunction {
  return async function (
    beacon: ContractAddressOrInstance,
    implFactory: ContractFactory,
    argsOrOpts?: unknown[] | DeployBeaconProxyOptions,
    opts?: DeployBeaconProxyOptions
  ): Promise<Contract> {
    if (isTdlyContractFactory(implFactory)) {
      implFactory = implFactory.getNativeContractFactory();
    }

    let proxyContract;
    if (opts !== undefined && opts !== null) {
      proxyContract = await func(beacon, implFactory, argsOrOpts as unknown[], opts);
    } else {
      proxyContract = await func(beacon, implFactory, argsOrOpts as DeployBeaconProxyOptions);
    }

    return new TdlyProxyContract(hre, tenderly, proxyContract) as unknown as ethers.Contract;
  };
}

function isTdlyContractFactory(factory: ContractFactory | TdlyContractFactory): factory is TdlyContractFactory {
  return (factory as TdlyContractFactory).getNativeContractFactory !== undefined;
}

export declare function getContractFactoryName(
  name: string,
  signerOrOptions?: ethers.Signer | FactoryOptions,
): Promise<ethers.ContractFactory>;

export declare function getContractFactoryABI(
  abi: any[],
  bytecode: ethers.BytesLike,
  signer?: ethers.Signer,
): Promise<ethers.ContractFactory>;

function wrapGetContractFactory(
  func: typeof getContractFactoryName | typeof getContractFactoryABI,
  tenderly: TenderlyPlugin,
): typeof getContractFactoryName | typeof getContractFactoryABI {
  return async function (
    nameOrAbi: string | any[],
    bytecodeOrFactoryOptions?:
      | (ethers.Signer | FactoryOptions)
      | ethers.BytesLike,
    signer?: ethers.Signer,
  ): Promise<ethers.ContractFactory> {
    if (typeof nameOrAbi === "string") {
      const contractFactory = await (func as typeof getContractFactoryName)(
        nameOrAbi,
        bytecodeOrFactoryOptions as ethers.Signer | FactoryOptions,
      );

      let libs;
      const factoryOpts = bytecodeOrFactoryOptions as
        | ethers.Signer
        | FactoryOptions;
      if (factoryOpts !== undefined && "libraries" in factoryOpts) {
        libs = factoryOpts.libraries;
      }

      return wrapContractFactory(contractFactory, tenderly, nameOrAbi, libs);
    }

    return (func as typeof getContractFactoryABI)(nameOrAbi, bytecodeOrFactoryOptions as ethers.BytesLike, signer,
    );
  };
}

export declare function deployContract(
  name: string,
  signerOrOptions?: ethers.Signer | DeployContractOptions,
): Promise<ethers.Contract>;

function wrapDeployContract(func: typeof deployContract, tenderly: TenderlyPlugin,
): typeof deployContract {
  return async function (
    name: string,
    signerOrOptions?: ethers.Signer | DeployContractOptions,
  ): Promise<ethers.Contract> {
    const contract = await func(name, signerOrOptions);

    let libraries;
    if (signerOrOptions !== undefined && "libraries" in signerOrOptions) {
      libraries = signerOrOptions.libraries;
    }

    return new TdlyContract(
      contract,
      tenderly,
      name,
      libraries,
    ) as unknown as ethers.Contract;
  };
}

export declare function getContractAt(
  nameOrAbi: string | any[],
  address: string,
  signer?: ethers.Signer,
): Promise<ethers.Contract>;

function wrapGetContractAt(
  func: typeof getContractAt,
  tenderly: TenderlyPlugin,
): typeof getContractAt {
  return async function (
    nameOrAbi: string | any[],
    address: string,
    signer?: ethers.Signer,
  ): Promise<ethers.Contract> {
    if (typeof nameOrAbi === "string") {
      const contract = await func(nameOrAbi, address, signer);
      await tryToVerify(tenderly, nameOrAbi, contract);

      return contract;
    }

    return func(nameOrAbi, address, signer);
  };
}

export declare function getContractFactoryFromArtifact(
  artifact: Artifact,
  signerOrOptions?: ethers.Signer | FactoryOptions,
): Promise<ethers.ContractFactory>;

function wrapGetContractFactoryFromArtifact(
  func: typeof getContractFactoryFromArtifact,
  tenderly: TenderlyPlugin,
): typeof getContractFactoryFromArtifact {
  return async function (
    artifact: Artifact,
    signerOrOptions?: ethers.Signer | FactoryOptions,
  ): Promise<ethers.ContractFactory> {
    const contractFactory = await func(artifact, signerOrOptions);

    let libs;
    const factoryOpts = signerOrOptions as ethers.Signer | FactoryOptions;
    if (factoryOpts !== undefined && "libraries" in factoryOpts) {
      libs = factoryOpts.libraries;
    }

    return wrapContractFactory(
      contractFactory,
      tenderly,
      artifact.contractName,
      libs,
    );
  };
}

export declare function getContractAtFromArtifact(
  artifact: Artifact,
  address: string,
  signer?: ethers.Signer,
): Promise<ethers.Contract>;

function wrapGetContractAtFromArtifact(
  func: typeof getContractAtFromArtifact,
  tenderly: TenderlyPlugin,
): typeof getContractAtFromArtifact {
  return async function (
    artifact: Artifact,
    address: string,
    signer?: ethers.Signer,
  ): Promise<ethers.Contract> {
    const contract = await func(artifact, address, signer);
    await tryToVerify(tenderly, artifact.contractName, contract);

    return contract;
  };
}

function wrapContractFactory(
  contractFactory: ethers.ContractFactory,
  tenderly: TenderlyPlugin,
  name: string,
  libraries?: Libraries,
): ethers.ContractFactory {
  contractFactory = new TdlyContractFactory(
    contractFactory,
    tenderly,
    name,
    libraries,
  ) as unknown as ethers.ContractFactory;

  return contractFactory;
}

async function tryToVerify(
  tenderly: TenderlyPlugin,
  name: string,
  contract: ethers.Contract,
) {
  await tenderly.verify({
    name,
    address: await contract.getAddress(),
  });
}
