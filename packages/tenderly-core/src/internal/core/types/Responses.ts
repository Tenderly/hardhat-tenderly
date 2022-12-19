import { ApiContract, BytecodeMismatchError, CompilationError } from "./Contract";

export interface ContractResponse {
  contracts: ApiContract[];
  bytecode_mismatch_errors: BytecodeMismatchError[];
}

export interface VerificationResult {
  bytecode_mismatch_error: BytecodeMismatchError;
  verified_contract: any; // TODO(dusan) document this, it shouldn't be any type
}

export interface VerifyContractsResponse {
  compilation_errors: CompilationError[];
  results: VerificationResult[];
}
