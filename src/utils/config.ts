import fs from "fs";
import * as yaml from "js-yaml";
import os from "os";
import path from "path";

const configDir = os.homedir() + path.sep + ".tenderly";
export const configFilepath = configDir + path.sep + "config.yaml";

export function getConfig(): any {
  if (configExists()) {
    const fileData = fs.readFileSync(configFilepath);
    return yaml.load(fileData.toString());
  }
  return {
    access_key: "",
    access_key_id: "",
    account_id: "",
    email: "",
    token: "",
    username: ""
  };
}

export function configExists(): boolean {
  return fs.existsSync(configFilepath);
}

export function isAccessTokenSet(): boolean {
  const accessToken = getConfig().access_key;
  return accessToken != undefined && accessToken != "";
}

export function getAccessToken(): string {
  if (!isAccessTokenSet()) {
    return "";
  }
  return getConfig().access_key;
}

export function setAccessToken(accessToken: string): void {
  const config = getConfig();
  config.access_key = accessToken;

  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configFilepath, yaml.safeDump(config), "utf8");
}
