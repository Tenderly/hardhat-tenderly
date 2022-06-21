import {
  FactoryOptions,
  HardhatEthersHelpers
} from "@nomiclabs/hardhat-ethers/src/types";
import { ethers } from "ethers";
import { Artifact } from "hardhat/types";

import { TenderlyPlugin } from "../type-extensions";

import { TdlyContractFactory } from "./ethers/ContractFactory";

export function wrapEthers(
  nativeEthers: typeof ethers & HardhatEthersHelpers,
  tenderly: TenderlyPlugin
): typeof ethers & HardhatEthersHelpers {
  // Factory
  nativeEthers.getContractFactoryFromArtifact = wrapGetContractFactoryFromArtifact(
    nativeEthers.getContractFactoryFromArtifact,
    tenderly
  ) as typeof nativeEthers.getContractFactoryFromArtifact;
  nativeEthers.getContractFactory = wrapGetContractFactory(
    nativeEthers.getContractFactory,
    tenderly
  ) as typeof nativeEthers.getContractFactory;

  // Contract
  nativeEthers.getContractAtFromArtifact = wrapGetContractAtFromArtifact(
    nativeEthers.getContractAtFromArtifact,
    tenderly
  ) as typeof nativeEthers.getContractAtFromArtifact;
  nativeEthers.getContractAt = wrapGetContractAt(
    nativeEthers.getContractAt,
    tenderly
  ) as typeof nativeEthers.getContractAt;

  return nativeEthers;
}

export declare function getContractFactoryName(
  name: string,
  signerOrOptions?: ethers.Signer | FactoryOptions
): Promise<ethers.ContractFactory>;
export declare function getContractFactoryABI(
  abi: any[],
  bytecode: ethers.utils.BytesLike,
  signer?: ethers.Signer
): Promise<ethers.ContractFactory>;

function wrapGetContractFactory(
  func: typeof getContractFactoryName | typeof getContractFactoryABI,
  tenderly: TenderlyPlugin
): typeof getContractFactoryName | typeof getContractFactoryABI {
  const ovrFunc:
    | typeof getContractFactoryName
    | typeof getContractFactoryABI = async function(
    nameOrAbi: string | any[],
    bytecodeOrFactoryOptions?:
      | (ethers.Signer | FactoryOptions)
      | ethers.utils.BytesLike,
    signer?: ethers.Signer
  ): Promise<ethers.ContractFactory> {
    if (typeof nameOrAbi === "string") {
      const contractFactory = await (func as typeof getContractFactoryName)(
        nameOrAbi,
        bytecodeOrFactoryOptions as ethers.Signer | FactoryOptions
      );

      return wrapContractFactory(contractFactory, tenderly, nameOrAbi);
    }

    return (func as typeof getContractFactoryABI)(
      nameOrAbi,
      bytecodeOrFactoryOptions as ethers.utils.BytesLike,
      signer
    );
  };

  return ovrFunc;
}

export declare function getContractAt(
  nameOrAbi: string | any[],
  address: string,
  signer?: ethers.Signer
): Promise<ethers.Contract>;

function wrapGetContractAt(
  func: typeof getContractAt,
  tenderly: TenderlyPlugin
): typeof getContractAt {
  const ovrFunc: typeof getContractAt = async function(
    nameOrAbi: string | any[],
    address: string,
    signer?: ethers.Signer
  ): Promise<ethers.Contract> {
    if (typeof nameOrAbi === "string") {
      const contract = await func(nameOrAbi, address, signer);
      await tryToVerify(tenderly, nameOrAbi, contract);

      return contract;
    }

    return func(nameOrAbi, address, signer);
  };

  return ovrFunc;
}

export declare function getContractFactoryFromArtifact(
  artifact: Artifact,
  signerOrOptions?: ethers.Signer | FactoryOptions
): Promise<ethers.ContractFactory>;

function wrapGetContractFactoryFromArtifact(
  func: typeof getContractFactoryFromArtifact,
  tenderly: TenderlyPlugin
): typeof getContractFactoryFromArtifact {
  const ovrFunc: typeof getContractFactoryFromArtifact = async function(
    artifact: Artifact,
    signerOrOptions?: ethers.Signer | FactoryOptions
  ): Promise<ethers.ContractFactory> {
    const contractFactory = await func(artifact, signerOrOptions);

    return wrapContractFactory(
      contractFactory,
      tenderly,
      artifact.contractName
    );
  };

  return ovrFunc;
}

export declare function getContractAtFromArtifact(
  artifact: Artifact,
  address: string,
  signer?: ethers.Signer
): Promise<ethers.Contract>;

function wrapGetContractAtFromArtifact(
  func: typeof getContractAtFromArtifact,
  tenderly: TenderlyPlugin
): typeof getContractAtFromArtifact {
  const ovrFunc: typeof getContractAtFromArtifact = async function(
    artifact: Artifact,
    address: string,
    signer?: ethers.Signer
  ): Promise<ethers.Contract> {
    const contract = await func(artifact, address, signer);
    await tryToVerify(tenderly, artifact.contractName, contract);

    return contract;
  };

  return ovrFunc;
}

function wrapContractFactory(
  contractFactory: ethers.ContractFactory,
  tenderly: TenderlyPlugin,
  name: string
): ethers.ContractFactory {
  contractFactory = (new TdlyContractFactory(
    contractFactory,
    tenderly,
    name
  ) as unknown) as ethers.ContractFactory;

  return contractFactory;
}

async function tryToVerify(
  tenderly: TenderlyPlugin,
  name: string,
  contract: ethers.Contract
) {
  await tenderly.verify({
    name,
    address: contract.address
  });
}
