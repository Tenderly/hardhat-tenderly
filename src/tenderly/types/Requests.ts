import {TenderlyContract, TenderlyContractConfig} from "./Contract";

export interface TenderlyContractUploadRequest {
  config: TenderlyContractConfig;
  contracts: TenderlyContract[];
  tag?: string;
}
