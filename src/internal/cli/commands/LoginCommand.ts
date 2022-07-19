import commander from "commander";
import open from 'open';
import promptly from "promptly";

import { configExists, initConfig, isAccessTokenSet, setAccessToken } from "../../../utils/config";

export const LoginCommand = new commander.Command("login")
  .description("login to Tenderly")
  .action(async () => {
    if (!configExists()) {
      initConfig()
    }

    if (isAccessTokenSet()) {
      const overwrite = await promptly.confirm("Access token already set. Would you like to overwrite it? (y/n)")
      if (!overwrite) {
        return
      }
    }

    setAccessToken(await getAccessToken());

    console.log("Successfully logged in.")
  });

const validator = function (value: string) {
  if (value.length != 32) {
    throw new Error('Invalid access token: length must be exactly 32 characters\n');
  }

  return value;
};

async function getAccessToken(): Promise<string> {
  console.log('Redirecting to https://dashboard.tenderly.co/account/authorization')
  await open('https://dashboard.tenderly.co/account/authorization');

  return await promptly.prompt('Enter access token: ', { validator })
}
