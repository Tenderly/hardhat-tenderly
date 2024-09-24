import semver from "semver";
import fetch from "npm-registry-fetch";

export class OutdatedVersionChecker {
  public async isVersionOutdated(
    hardhatTenderlyVersion: string
  ): Promise<[boolean, string]> {
    let hardhatTenderlyVersionRangeToFind: string;
    if (semver.major(hardhatTenderlyVersion) === 1) {
      hardhatTenderlyVersionRangeToFind = "^1.0.0";
    } else {
      hardhatTenderlyVersionRangeToFind = "^2.0.0";
    }

    const latestHardhatTenderlyVersion = await this._getLatestHardhatTenderlyVersionsInRange(hardhatTenderlyVersionRangeToFind);

    if (semver.compare(hardhatTenderlyVersion, latestHardhatTenderlyVersion) === -1) {
      return [true, latestHardhatTenderlyVersion]; 
    }
    
    return [false, latestHardhatTenderlyVersion];
  } 
  
  private async _getLatestHardhatTenderlyVersionsInRange(
    versionRange: string
  ): Promise<string> {
    const data = await fetch.json("/@tenderly/hardhat-tenderly");
    const versions = Object.keys(data.versions as any)
    
    return semver.maxSatisfying(versions, versionRange) as string;
  }
}
