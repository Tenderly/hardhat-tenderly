import open from "open";
import axios from "axios";
import prompts from "prompts";
import commander from "commander";
import { logger } from "../../../utils/logger";

import { isAccessTokenSet, setAccessToken } from "../../../utils/config";
import {
  TENDERLY_API_BASE_URL,
  TENDERLY_DASHBOARD_BASE_URL,
} from "../../../common/constants";

export const LoginCommand = new commander.Command("login")
  .description("login to Tenderly")
  .action(async () => {
    logger.info("Trying to login to Tenderly.");

    if (isAccessTokenSet()) {
      logger.debug(
        "Access token is already set. Checking if access token overwrite is needed.",
      );
      const response = await prompts({
        type: "confirm",
        name: "overwrite",
        message: "Access token already set. Would you like to overwrite it?",
      });
      if (!response.overwrite) {
        logger.debug(
          "Access token overwrite skipped. Trying to login with the existing token.",
        );
        return;
      }
    }

    logger.info("Access token not set.");
    const accessToken = await promptAccessToken();

    logger.debug("Access token accepted. Trying to log in.");
    setAccessToken(accessToken);

    console.log("Successfully logged in to Tenderly.");
    logger.info("Successfully logged in to Tenderly.");
  });

async function promptAccessToken(): Promise<string> {
  console.log(
    `Redirecting to ${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`,
  );
  logger.debug(
    `Redirecting to ${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`,
  );
  await open(`${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`);

  logger.info("Requesting access token.");
  const response = await prompts({
    type: "text",
    name: "accessToken",
    message: "Enter access token",
    validate: validator,
  });

  logger.info("Access token accepted.");
  return response.accessToken;
}

const validator = async function (value: string) {
  if (value.length !== 32) {
    return "Invalid access token: length must be exactly 32 characters";
  }

  const canAuth = await canAuthenticate(value);
  if (!canAuth) {
    return "Invalid access token: unable to authenticate";
  }

  return true;
};

async function canAuthenticate(accessToken: string): Promise<boolean> {
  try {
    logger.debug("Checking if access token is valid.");
    const response = await axios.get(`${TENDERLY_API_BASE_URL}/api/v1/user`, {
      headers: { "x-access-key": accessToken },
    });
    if (response.data.user === undefined || response.data.user === null) {
      logger.error("Access token is invalid.");
      return false;
    }
    logger.debug("Access token is valid.");
    return true;
  } catch (err) {
    logger.error("Authentication error.");
    return false;
  }
}
