import fs from "fs";
import os from "os";
import path from "path";
import * as yaml from "js-yaml";
import { TenderlyConfig } from "../types";
import { logger } from "./logger";

const configDir = `${os.homedir() + path.sep}.tenderly`;
export const configFilePath = `${configDir + path.sep}config.yaml`;

export function getConfig(): TenderlyConfig {
  logger.trace("Getting tenderly config...");

  if (configExists()) {
    const fileData = fs.readFileSync(configFilePath);

    const tenderlyConfig = yaml.load(fileData.toString()) as TenderlyConfig;
    logger.trace("Tenderly config exists. Value of the config:", {
      email: tenderlyConfig.email,
      account_id: tenderlyConfig.account_id,
      username: tenderlyConfig.username,
      access_key:
        tenderlyConfig.access_key !== undefined &&
        tenderlyConfig.access_key !== null &&
        tenderlyConfig.access_key !== ""
          ? "super secret access_key is set in 'access_key' field"
          : "undefined or null or empty string",
      access_key_id:
        tenderlyConfig.access_key_id !== undefined &&
        tenderlyConfig.access_key_id !== null &&
        tenderlyConfig.access_key_id !== ""
          ? "super secret access_key_id is set in 'access_key' field"
          : "undefined or null or empty string",
    });

    return tenderlyConfig;
  }

  logger.trace("Tenderly config doesn't exist, empty string values have been returned.");
  return {
    access_key: "",
    access_key_id: "",
    account_id: "",
    email: "",
    token: "",
    username: "",
  };
}

export function writeConfig(config: TenderlyConfig): void {
  logger.trace(`Writing config to a file @ ${configDir}/${configFilePath}`);
  logger.trace("Value of the config:", config);

  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configFilePath, yaml.dump(config), "utf8");
}

export function configExists(): boolean {
  logger.trace("Checking if config exists...");
  return fs.existsSync(configFilePath);
}

export function isAccessTokenSet(): boolean {
  logger.trace("Determining if access token in tenderly config file is set...");
  const config = getConfig();

  const isSet = config.access_key !== undefined || config.access_key !== "";
  logger.trace("Access key is set:", isSet);

  return isSet;
}

export function getAccessToken(): string {
  logger.trace("Getting access token...");
  if (!isAccessTokenSet()) {
    logger.trace("Access key is not set, returning empty string value.");
    return "";
  }

  const accessKey = getConfig().access_key;
  logger.trace("Access key:", accessKey);

  return accessKey;
}

export function setAccessToken(accessToken: string): void {
  logger.trace("Setting access key to value:", accessToken, " ....");
  const config = getConfig();
  config.access_key = accessToken;
  writeConfig(config);
}
