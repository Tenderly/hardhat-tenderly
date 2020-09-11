import "@nomiclabs/buidler/types";

declare module "@nomiclabs/buidler/types" {
  export interface BuidlerRuntimeEnvironment {
    tenderly: {
      verifyContract: (...contracts) => Promise<void>
      pushContract: (...contracts) => Promise<void>
    };
  }

  export interface BuidlerConfig {
    projectSlug?: string;
    tenderlyUsername?: string;
  }

  export interface ResolvedBuidlerConfig {
    projectSlug: string;
    tenderlyUsername: string;
  }
}
