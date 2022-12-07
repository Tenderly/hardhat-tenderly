import open from "open";
import axios from "axios";
import prompts from "prompts";
import commander from "commander";
import { logger } from "../../../utils/logger";

import { isAccessTokenSet, setAccessToken } from "../../../utils/config";
import { TENDERLY_API_BASE_URL, TENDERLY_DASHBOARD_BASE_URL } from "../../../common/constants";

export const LoginCommand = new commander.Command("login").description("login to Tenderly").action(async () => {
  logger.info("Trying to log in to Tenderly...");

  if (isAccessTokenSet()) {
    logger.debug("Access token is set. Prompting user to overwrite access token with a new one.");
    const response = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "Access token already set. Would you like to overwrite it?",
    });
    if (!response.overwrite) {
      logger.debug("User didn't request an overwrite of the token. Proceeding logging in with existing token.");
      return;
    }
  }

  logger.info("Access token isn't set. Prompting user to enter access token...");
  const accessToken = await promptAccessToken();

  logger.debug("User entered access token. Setting access token...");
  setAccessToken(accessToken);

  logger.info("Successfully logged in.");
});

async function promptAccessToken(): Promise<string> {
  logger.debug(`Redirecting to ${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`);
  await open(`${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`);

  logger.info("Prompting user to enter access token");
  const response = await prompts({
    type: "text",
    name: "accessToken",
    message: "Enter access token",
    validate: validator,
  });

  logger.info("User entered access token.");
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
    logger.debug("Checking if user access token is valid...");
    const response = await axios.get(`${TENDERLY_API_BASE_URL}/api/v1/user`, {
      headers: { "x-access-key": accessToken },
    });
    if (response.data.user !== undefined) {
      logger.debug("User has a valid access token.");
      return true;
    }
    logger.error("User doesn't have a valid access token.");
    return false;
  } catch (err) {
    logger.error(`There was an error while making the api call ${TENDERLY_API_BASE_URL}/api/v1/user`);
    return false;
  }
}
