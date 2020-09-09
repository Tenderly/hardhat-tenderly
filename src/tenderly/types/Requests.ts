import {TenderlyContract, TenderlyContractConfig} from "./Contract";

export interface TenderlyContractUploadRequest {
  config: TenderlyContractConfig;
  contracts: TenderlyContract[];
  tag?: string;
}

export const newContractUploadRequest = (
  config: TenderlyContractConfig,
  contracts: TenderlyContract[],
  tag: string
): TenderlyContractUploadRequest => {
  return {
    config,
    contracts,
    tag
  };
};
