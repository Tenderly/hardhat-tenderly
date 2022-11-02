import { ApiContract, BytecodeMismatchError } from "./Contract";

export interface ContractResponse {
  contracts: ApiContract[];
  bytecode_mismatch_errors: BytecodeMismatchError[];
}
