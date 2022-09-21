import open from "open";
import axios from "axios";
import prompts from "prompts";
import commander from "commander";

import { isAccessTokenSet, setAccessToken } from "../../../utils/config";
import { TENDERLY_API_BASE_URL, TENDERLY_DASHBOARD_BASE_URL } from "../../../common/constants";

export const LoginCommand = new commander.Command("login").description("login to Tenderly").action(async () => {
  if (isAccessTokenSet()) {
    const response = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "Access token already set. Would you like to overwrite it?",
    });
    if (!response.overwrite) {
      return;
    }
  }

  const accessToken = await promptAccessToken();

  setAccessToken(accessToken);
  console.log("Successfully logged in.");
});

async function promptAccessToken(): Promise<string> {
  console.log(`Redirecting to ${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`);
  await open(`${TENDERLY_DASHBOARD_BASE_URL}/account/authorization`);

  const response = await prompts({
    type: "text",
    name: "accessToken",
    message: "Enter access token",
    validate: validator,
  });

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
    const response = await axios.get(`${TENDERLY_API_BASE_URL}/api/v1/user`, {
      headers: { "x-access-key": accessToken },
    });
    if (response.data.user !== undefined) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}
