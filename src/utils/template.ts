import fs from "fs";

export class VNetTemplate {
  public projectSlug: string;
  public username: string;
  public network: string;
  public blockNumber: string;

  public constructor(...args: any[]) {
    if (args.length == 0) {
      this.projectSlug = "";
      this.username = "";
      this.network = "";
      this.blockNumber = "";
    } else {
      this.projectSlug = args[0];
      this.username = args[1];
      this.network = args[2];
      this.blockNumber = args[3];
    }
  }
}

export function initTemplate(filepath: string) {
  const templateData: VNetTemplate = new VNetTemplate();
  fs.writeFileSync(filepath, JSON.stringify(templateData, null, 2), "utf8");
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

export function getTemplate(filepath: string): VNetTemplate {
  return JSON.parse(fs.readFileSync(filepath).toString());
}

export function templateExists(filepath: string): boolean {
  return fs.existsSync(filepath);
}
