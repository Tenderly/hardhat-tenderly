import { CompilerConfiguration } from "./Compiler";

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
  networks: Record<string, ContractNetwork>;
  compiler: CompilerConfiguration;
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
  address: string;
  network_id: string;
}

export interface BytecodeMismatchError {
  contract_id: string;
  expected: string;
  got: string;
  similarity: number;
  assumed_reason: string;
}

export interface VerificationResult {
  bytecodeMismatchError: BytecodeMismatchError;
  verifiedContract: any; // TODO(dusan) document this, it shouldn't be any type
}
