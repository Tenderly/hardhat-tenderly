import "@nomiclabs/buidler/types";

import {TenderlyConfig} from "./tenderly/types";

declare module "@nomiclabs/buidler/types" {
  export interface BuidlerRuntimeEnvironment {
    tenderly: {
      verify: (...contracts) => Promise<void>;
      push: (...contracts) => Promise<void>;
    };
  }

  export interface BuidlerConfig {
    tenderly?: TenderlyConfig;
  }

  export interface ResolvedBuidlerConfig {
    tenderly: TenderlyConfig;
  }
}
