import axios from "axios";
import commander from "commander";
import open from "open";
import promptly from "promptly";

import { TENDERLY_API_BASE_URL } from "../../../tenderly/TenderlyService";
import { isAccessTokenSet, setAccessToken } from "../../../utils/config";

export const LoginCommand = new commander.Command("login").description("login to Tenderly").action(async () => {
  if (isAccessTokenSet()) {
    const overwrite = await promptly.confirm("Access token already set. Would you like to overwrite it? (y/n)", {
      default: "y"
    });
    if (!overwrite) {
      return;
    }
  }

  const accessToken = await promptAccessToken();
  const valid = await isAccessTokenValid(accessToken);
  if (!valid) {
    return;
  }

  setAccessToken(accessToken);
  console.log("Successfully logged in.");
});

const validator = function(value: string) {
  if (value.length != 32) {
    throw new Error("Invalid access token: length must be exactly 32 characters\n");
  }

  return value;
};

async function promptAccessToken(): Promise<string> {
  console.log("Redirecting to https://dashboard.tenderly.co/account/authorization");
  await open("https://dashboard.tenderly.co/account/authorization");

  return await promptly.prompt("Enter access token: ", { validator });
}

async function isAccessTokenValid(accessToken: string): Promise<boolean> {
  try {
    await axios.get(`${TENDERLY_API_BASE_URL}/api/v1/user`, { headers: { "x-access-key": accessToken } });
    return true;
  } catch (err) {
    if (err?.response?.status == 401) {
      console.log("Error: Invalid access token");
      return false;
    }
    console.log("Error:", err?.response?.data?.error?.message);
    return false;
  }
}
