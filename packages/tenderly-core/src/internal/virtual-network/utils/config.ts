import fs from "fs";

import { VirtualNetworkConfig } from "../types";

export function writeConfig(filepath: string, config: VirtualNetworkConfig) {
  fs.writeFileSync(filepath, JSON.stringify(config, null, 2), "utf8");
}

export function updateChainConfig(filepath: string, chainConfig?: Record<string, string>) {
  if (chainConfig == undefined) {
    return;
  }

  let configData = getConfig(filepath);
  configData.chain_config = chainConfig;

  writeConfig(filepath, configData);
}

export function getConfig(filepath: string): VirtualNetworkConfig {
  return JSON.parse(fs.readFileSync(filepath).toString());
}

export function configExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}
