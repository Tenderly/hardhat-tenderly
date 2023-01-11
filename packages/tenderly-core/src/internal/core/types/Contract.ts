import { SolcConfig } from "hardhat/types";

export interface TenderlyContractConfig {
  compiler_version?: string;
  optimizations_used?: boolean;
  optimizations_count?: number;
  evm_version?: string;
  debug?: CompilerDebugInput;
}

export interface CompilerDebugInput {
  revertStrings?: string;
}

export interface TenderlyContract {
  contractName: string;
  source: string;
  sourcePath: string;
  compiler?: ContractCompiler;
  networks?: Record<string, ContractNetwork>;
}

export interface TenderlyVerificationContract {
  contractToVerify: string;
  sources: Record<string, TenderlyVerifyContractsSource>;
  networks?: Record<string, ContractNetwork>;
  compiler?: SolcConfig;
}

export interface TenderlyVerifyContractsSource {
  name: string;
  code: string;
}

export interface TenderlyArtifact {
  address: string;
  metadata: string;
  bytecode: string;
  deployedBytecode: string;
  abi: any;
}

export interface ContractCompiler {
  name?: string;
  version: string;
}

export interface ContractNetwork {
  events?: any;
  links?: Record<string, string>;
  address: string;
  transactionHash?: string;
}

export interface ApiContract {
  id: string;
  contract_id: string;
  balance: string;
  network_id: string;
  public: boolean;
  export: boolean;
  verification_date: string;
  address: string;
  contract_name: string;
  ens_domain: string[];
  type: string;
  evm_version: string;
  compiler_version: string;
  optimizations_used: boolean;
  optimization_runs: number;
  libraries: Record<string, string>;
  data: object;
  creation_block: number;
  creation_tx: string;
  creator_address: string;
  created_at: string;
  number_of_watches: number;
  language: string;
  in_project: boolean;
  number_of_files: number;
}

export interface BytecodeMismatchError {
  contract_id: string;
  expected: string;
  got: string;
  similarity: number;
  assumed_reason: string;
}

export interface CompilationError {
  source_location: SourceLocation;
  error_type: string;
  component: string;
  message: string;
  formatted_message: string;
}

export interface SourceLocation {
  file: string;
  start: number;
  end: number;
}
