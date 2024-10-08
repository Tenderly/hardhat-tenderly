import { ContractCompiler } from "@tenderly/api-client/types";

export interface BytecodeMismatchError {
  contract_id: string;
  expected: string;
  got: string;
}

export interface HardhatTenderlyConfig {
  project: string;
  username: string;
  forkNetwork?: string;
  privateVerification?: boolean;
  deploymentsDir?: string;
  accessKey?: string;
  token?: string;
}

export interface Metadata {
  defaultCompiler: ContractCompiler;
  sources: Record<string, MetadataSources>;
}

export interface MetadataSources {
  content: string;
  versionPragma: string;
}
