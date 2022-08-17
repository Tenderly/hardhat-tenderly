import fs from "fs";

export class VNetTemplate {
  public project_slug: string;
  public username: string;
  public network: string;
  public block_number: string;
  public chain_config?: Record<string, string>;

  public constructor(...args: any[]) {
    if (args.length == 0) {
      this.project_slug = "";
      this.username = "";
      this.network = "";
      this.block_number = "";
    } else {
      this.project_slug = args[0];
      this.username = args[1];
      this.network = args[2];
      this.block_number = args[3];
    }
  }
}

export function writeTemplate(
  filepath: string,
  projectSlug: string,
  username: string,
  network: string,
  blockNumber: string
) {
  const templateData = new VNetTemplate(
    projectSlug,
    username,
    network,
    blockNumber
  );
  fs.writeFileSync(filepath, JSON.stringify(templateData, null, 2), "utf8");
}

export function updateChainConfig(
  filepath: string,
  chainConfig?: Record<string, string>
) {
  if (chainConfig == undefined) {
    return;
  }

  let templateData = getTemplate(filepath);
  templateData.chain_config = chainConfig;
  fs.writeFileSync(filepath, JSON.stringify(templateData, null, 2), "utf8");
}

export function getTemplate(filepath: string): VNetTemplate {
  return JSON.parse(fs.readFileSync(filepath).toString());
}

export function templateExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}
