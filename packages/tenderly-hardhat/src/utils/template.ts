import fs from "fs";

export type VNetTemplate = {
  project_slug: string;
  username: string;
  network: string;
  block_number: string;
  chain_config?: Record<string, string>;
};

export function writeTemplate(filepath: string, config: VNetTemplate) {
  fs.writeFileSync(filepath, JSON.stringify(config, null, 2), "utf8");
}

export function updateChainConfig(filepath: string, chainConfig?: Record<string, string>) {
  if (chainConfig == undefined) {
    return;
  }

  let configData = getTemplate(filepath);
  configData.chain_config = chainConfig;

  writeTemplate(filepath, chainConfig);
}

export function getTemplate(filepath: string): VNetTemplate {
  return JSON.parse(fs.readFileSync(filepath).toString());
}

export function templateExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}
