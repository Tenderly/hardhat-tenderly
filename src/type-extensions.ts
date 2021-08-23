import "hardhat/types/config";
import "hardhat/types/runtime";

import { TenderlyConfig } from "./tenderly/types";
import { TenderlyNetwork } from "./TenderlyNetwork";

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    tenderly: {
      verify: (...contracts) => Promise<void>;
      push: (...contracts) => Promise<void>;
      persistArtifacts: (...contracts) => Promise<void>;
      network: () => TenderlyNetwork;
      setNetwork: (network: TenderlyNetwork) => TenderlyNetwork;
    };
    tenderlyNetwork: {
      send: (
        request: {
          method: string;
          params?: any[];
        },
        callback: (error: any, response: any) => void
      ) => void;
      verify: (...contracts) => Promise<void>;
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
