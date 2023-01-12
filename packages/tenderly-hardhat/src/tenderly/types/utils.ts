import { ContractCompiler } from "tenderly/types";

export interface BytecodeMismatchError {
  contract_id: string;
  expected: string;
  got: string;
}

export interface TenderlyConfig {
  project: string;
  username: string;
  forkNetwork?: string;
  privateVerification?: boolean;
  deploymentsDir?: string;
}

export interface Metadata {
  defaultCompiler: ContractCompiler;
  sources: Record<string, MetadataSources>;
}

export interface MetadataSources {
  content: string;
  versionPragma: string;
}
