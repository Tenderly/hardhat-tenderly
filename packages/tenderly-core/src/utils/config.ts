import fs from "fs";
import os from "os";
import path from "path";
import * as yaml from "js-yaml";

import { TenderlyConfig } from "../types";

const configDir = `${os.homedir() + path.sep}.tenderly`;
export const configFilePath = `${configDir + path.sep}config.yaml`;

export function getConfig(): TenderlyConfig {
  if (configExists()) {
    const fileData = fs.readFileSync(configFilePath);
    return yaml.load(fileData.toString());
  }
  return {
    access_key: "",
    access_key_id: "",
    account_id: "",
    email: "",
    token: "",
    username: "",
  };
}

export function configExists(): boolean {
  return fs.existsSync(configFilePath);
}

export function isAccessTokenSet(): boolean {
  const config = getConfig();
  return config.access_key !== undefined || config.access_key !== "";
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
  fs.writeFileSync(configFilePath, yaml.safeDump(config), "utf8");
}
