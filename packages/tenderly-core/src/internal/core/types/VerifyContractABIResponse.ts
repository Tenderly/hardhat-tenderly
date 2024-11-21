import { ContractResponse } from "./Responses";

export interface VerifyContractABIResponse {
  error: any // we will only log this error, won't return it, so it's okay to be any for now.
}
