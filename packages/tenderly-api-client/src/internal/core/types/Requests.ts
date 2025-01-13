import {
  TenderlyContract,
  TenderlyContractConfig,
  TenderlyVerificationContract,
} from "./Contract";

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

export interface TenderlyAddContractRequest {
  network_id: string;
  address: string;
  display_name?: string;
  unverified?: boolean;
}
