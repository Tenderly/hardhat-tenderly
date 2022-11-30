import {VerificationResult} from "../types";

const API_ERR_MSG = "Unexpected error occurred. \n  Error reason %s %s. \n  Error context: %s";
import { logger } from "../../../utils/logger";
import { CHAIN_ID_NETWORK_NAME_MAP, TENDERLY_DASHBOARD_BASE_URL } from "../../../common/constants";

export function logApiError(err: any) {
  // api error
  if ("response" in err) {
    const code = err?.response?.status;
    const codeText = err?.response?.statusText;
    let message = "No message";
    if (err.response?.data?.error?.message) {
      message = err.response.data.error.message;
    } else if (err.response?.data) {
      message = err.response.data;
    }

    logger.error(API_ERR_MSG, code, codeText, message);
    return;
  }

  // general error
  if (err instanceof Error) {
    logger.error(err.message);
  }
}

export function logVerificationResult(res: VerificationResult) {
  if (res.bytecode_mismatch_error !== undefined && res.bytecode_mismatch_error !== null) {
    console.log("There has been a bytecode mismatch:", res.bytecode_mismatch_error);
    logger.trace("There has been a bytecode mismatch:", res.bytecode_mismatch_error);
    return;
  }

  const contractLink = `${TENDERLY_DASHBOARD_BASE_URL}/contract/${
    CHAIN_ID_NETWORK_NAME_MAP[res.verified_contract.network_id]
  }/${res.verified_contract.address}`;

  console.log(
    `Contract ${res.verified_contract.address} successfully verified. You can view the contract at ${contractLink}`
  );

  logger.trace("Contract successfully verified:", res.verified_contract);
}
