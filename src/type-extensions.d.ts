import "@nomiclabs/buidler/types";

declare module "@nomiclabs/buidler/types" {
  export interface BuidlerRuntimeEnvironment {
    tenderly: {
      verifyContract: (...contracts) => Promise<void>
      pushContract: (...contracts) => Promise<void>
    };
  }

  export interface BuidlerConfig {
    tenderlyProject?: string;
    tenderlyUsername?: string;
  }

  export interface ResolvedBuidlerConfig {
    tenderlyProject: string;
    tenderlyUsername: string;
  }
}
