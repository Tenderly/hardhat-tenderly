export interface TenderlyContractConfig {
  compiler_version?: string;
  optimizations_used?: boolean;
  optimizations_count?: number;
  evm_version?: string;
}

export interface TenderlyContract {
  contractName: string;
  source: string;
  sourcePath: string;
  compiler?: ContractCompiler;
  networks?: Record<string, ContractNetwork>;
}

export interface ContractCompiler {
  name: string;
  version: string;
}

export interface ContractNetwork {
  events?: any;
  links?: Record<string, string>;
  address: string;
  transactionHash?: string;
}

export interface ContractByName {
  name: string;
  address: string;
  network: string;
}
