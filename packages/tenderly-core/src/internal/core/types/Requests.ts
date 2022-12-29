import { AddContractData, TenderlyContract, TenderlyContractConfig, TenderlyVerificationContract } from "./Contract";

export interface TenderlyContractUploadRequest {
  config: TenderlyContractConfig;
  contracts: TenderlyContract[];
  tag?: string;
}

export interface TenderlyVerifyContractsRequest {
  contracts: TenderlyVerificationContract[];
}

export interface TenderlyForkContractUploadRequest {
  config: TenderlyContractConfig;
  contracts: TenderlyContract[];
  tag?: string;
  root: string;
}

export interface TenderlyBulkAddRequest {
  contracts: AddContractData[];
}
