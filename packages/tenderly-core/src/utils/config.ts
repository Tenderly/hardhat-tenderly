import fs from "fs";
import os from "os";
import path from "path";
import * as yaml from "js-yaml";
import { TenderlyConfig } from "../types";
import { logConfig } from "../internal/core/common/logger";
import { logger } from "./logger";

const configDir = `${os.homedir() + path.sep}.tenderly`;
export const configFilePath = `${configDir + path.sep}config.yaml`;

export function getConfig(): TenderlyConfig {
  logger.trace("Getting tenderly config...");

  if (configExists()) {
    const fileData = fs.readFileSync(configFilePath);

    const tenderlyConfig = yaml.load(fileData.toString()) as TenderlyConfig;
    logConfig(tenderlyConfig);

    return tenderlyConfig;
  }

  logger.warn("Tenderly config doesn't exist, empty string values are returned instead.");
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
  logger.trace(`Writing tenderly config to a file @ ${configDir}/${configFilePath}`);
  logConfig(config);

  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configFilePath, yaml.dump(config), "utf8");
}

export function configExists(): boolean {
  logger.trace("Checking if tenderly config exists...");
  const exists = fs.existsSync(configFilePath);
  logger.trace(exists ? "Tenderly config exists." : "Tenderly config doesn't exist.");

  return exists;
}

export function isAccessTokenSet(): boolean {
  logger.trace("Determining if access token in tenderly config file is set...");
  const config = getConfig();

  const isSet = config.access_key !== undefined && config.access_key !== null && config.access_key !== "";
  logger.trace(isSet ? "Access key is set." : "Access key is not set.");

  return isSet;
}

export function getAccessToken(): string {
  logger.trace("Getting access token...");
  if (!isAccessTokenSet()) {
    logger.warn("Access key is not set, returning empty string value.");
    return "";
  }

  return getConfig().access_key;
}

export function setAccessToken(accessToken: string): void {
  logger.trace("Setting access key...");
  const config = getConfig();
  config.access_key = accessToken;
  writeConfig(config);
}
