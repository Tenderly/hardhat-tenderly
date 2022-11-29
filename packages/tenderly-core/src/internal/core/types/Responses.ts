import { ApiContract, BytecodeMismatchError, VerificationResult } from "./Contract";
import { CompilationError } from "./Compiler";

export interface ContractResponse {
  contracts: ApiContract[];
  bytecode_mismatch_errors: BytecodeMismatchError[];
}

export interface VerifyContractsResponse {
  compilationErrors: CompilationError[];
  verificationResults: VerificationResult[];
}
