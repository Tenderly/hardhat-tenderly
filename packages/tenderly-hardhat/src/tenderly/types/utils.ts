import { ContractCompiler } from "tenderly/src/types";

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
  contractName?: string;
  content: string;
  versionPragma: string;
}
