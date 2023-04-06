import { ApiContract, BytecodeMismatchError, CompilationError } from "./Contract";

export interface ContractResponse {
  contracts: ApiContract[];
  bytecode_mismatch_errors: BytecodeMismatchError[];
}

export interface VerificationResult {
  bytecode_mismatch_error: BytecodeMismatchError;
  verified_contract: any;
}

export interface VerifyContractsResponse {
  compilation_errors: CompilationError[];
  results: VerificationResult[];
  display_link?: string
}
