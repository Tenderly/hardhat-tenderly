import "hardhat/types/config";
import "hardhat/types/runtime";

import {
  TenderlyConfig,
  TenderlyContractUploadRequest,
  TenderlyForkContractUploadRequest
} from "./tenderly/types";
import { TenderlyNetwork } from "./TenderlyNetwork";

export interface TdlyContract {
  name: string;
  address: string;
}

export interface TenderlyPlugin {
  verify: (...contracts: TdlyContract[]) => Promise<void>;
  verifyAPI: (request: TenderlyContractUploadRequest) => Promise<void>;
  push: (...contracts: TdlyContract[]) => Promise<void>;
  pushAPI: (
    request: TenderlyContractUploadRequest,
    tenderlyProject: string,
    username: string
  ) => Promise<void>;
  verifyForkAPI: (
    request: TenderlyForkContractUploadRequest,
    tenderlyProject: string,
    username: string,
    forkID: string
  ) => Promise<void>;
  persistArtifacts: (...contracts) => Promise<void>;
  network: () => TenderlyNetwork;
  setNetwork: (network: TenderlyNetwork) => TenderlyNetwork;
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    tenderly: TenderlyPlugin;
    tenderlyNetwork: {
      send: (
        request: {
          method: string;
          params?: any[];
        },
        callback: (error: any, response: any) => void
      ) => void;
      verify: (...contracts) => Promise<void>;
      verifyAPI: (
        request: TenderlyForkContractUploadRequest,
        tenderlyProject: string,
        username: string,
        forkID: string
      ) => Promise<void>;
      resetFork: () => string | undefined;
      getHead: () => string | undefined;
      setHead: (head: string | undefined) => void;
      getFork: () => string | undefined;
      setFork: (fork: string | undefined) => void;
      initializeFork: () => Promise<void>;
    };
  }
}

declare module "hardhat/types/config" {
  export interface HardhatUserConfig {
    tenderly?: TenderlyConfig;
  }

  export interface HardhatConfig {
    tenderly: TenderlyConfig;
  }
}
