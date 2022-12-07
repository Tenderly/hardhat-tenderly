import { TenderlyConfig } from "../../../types";

const API_ERR_MSG = "Unexpected error occurred. \n  Error reason %s %s. \n  Error context: %s";
import { logger } from "../../../utils/logger";

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

export function logConfig(config: TenderlyConfig) {
  logger.trace("Value of the config:", {
    email:
      config.email !== undefined && config.email !== null && config.email !== ""
        ? "super secret access_key is set in 'access_key' field"
        : "undefined or null or empty string",
    account_id: config.account_id,
    username:
      config.username !== undefined && config.username !== null && config.username !== ""
        ? "super secret access_key is set in 'access_key' field"
        : "undefined or null or empty string",
    access_key:
      config.access_key !== undefined && config.access_key !== null && config.access_key !== ""
        ? "super secret access_key is set in 'access_key' field"
        : "undefined or null or empty string",
    access_key_id:
      config.access_key_id !== undefined && config.access_key_id !== null && config.access_key_id !== ""
        ? "super secret access_key_id is set in 'access_key' field"
        : "undefined or null or empty string",
  });
}
