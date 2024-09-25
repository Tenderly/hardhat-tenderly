import { HardhatRuntimeEnvironment } from "hardhat/types";

export class VersionCompatibilityChecker {
  public areEthersAndHardhatTenderlyVersionsCompatible(
    hre: HardhatRuntimeEnvironment,
    hardhatTenderlyVersion: string
  ): [boolean, string, string] {
    // todo: there should be an interface VersionProvider from this tenderly-hardhat package.
    //   the hre-extender-v1 and hre-extender-v2 packages should implement that interface on their own
    //   for both EthersVersionProvider and TenderlyVersionProvider.
    //   I am casting this to `any` just for the sake of time.
    //   With this approach, this can easily be tested as well.
    let ethersVersion = (hre as any).ethers.version as string;
    ethersVersion = this._trimVersion(ethersVersion, "ethers/");
    const ethersMajorVersion = this._majorVersion(ethersVersion);

    const hardhatTenderlyMajorVersion = this._majorVersion(hardhatTenderlyVersion);

    return [this._areCompatible(ethersMajorVersion, hardhatTenderlyMajorVersion), ethersVersion, hardhatTenderlyVersion];
  }

  // todo: change this function once we have the available data of which hardhat-tenderly version is the newest.
  //   Then,
  //   the function will call the API to get the newest hardhat-tenderly version
  //   and we can use that to print out the command to upgrade the plugin.
  public compatibleHardhatTenderlyVersionForEthersVersion(ethersVersion: string): string {
    ethersVersion = this._trimVersion(ethersVersion, "ethers/");
    const ethersMajorVersion = this._majorVersion(ethersVersion);

    if (ethersMajorVersion === 5) {
      return "1.x.x.";
    }
    if (ethersMajorVersion === 6) {
      return "2.x.x";
    }

    throw new Error(`Unsupported ethers version: ${ethersVersion}`);
  }
  
  private _trimVersion(version: string, toTrim: string): string {
    if (version.startsWith(toTrim)) {
      return version.slice(toTrim.length);
    }
    return version;
  }

  private _majorVersion(version: string): number {
    return parseInt(version.split(".")[0], 10);
  }

  private _areCompatible(ethersMajorVersion: number, hardhatTenderlyMajorVersion: number): boolean {
    if (ethersMajorVersion === 5 && hardhatTenderlyMajorVersion === 1) {
      return true;
    }
    if (ethersMajorVersion === 6 && hardhatTenderlyMajorVersion === 2) {
      return true;
    }

    return false;
  }
}
