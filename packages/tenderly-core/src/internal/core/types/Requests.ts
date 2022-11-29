import { TenderlyContract, TenderlyContractConfig, ContractNetwork, TenderlyVerifyContractsSource } from "./Contract";
import { CompilerConfiguration } from "./Compiler";

export interface TenderlyContractUploadRequest {
  config: TenderlyContractConfig;
  contracts: TenderlyContract[];
  tag?: string;
}

export interface TenderlyVerifyContractsRequest {
  contractToVerify: string;
  sources: Record<string, TenderlyVerifyContractsSource>;
  networks: Record<string, ContractNetwork>;
  compiler: CompilerConfiguration;
}

export interface TenderlyForkContractUploadRequest {
  config: TenderlyContractConfig;
  contracts: TenderlyContract[];
  tag?: string;
  root: string;
}
