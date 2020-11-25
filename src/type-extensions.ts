import "hardhat/types/config";
import "hardhat/types/runtime";

import { TenderlyConfig } from "./tenderly/types";

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    tenderly: {
      verify: (...contracts) => Promise<void>;
      push: (...contracts) => Promise<void>;
      persistArtifact: (...contracts) => Promise<void>;
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
