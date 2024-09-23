import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config();

main();

function main() {
  const versionToRelease = parseInt(process.argv[2]);
  if (isNaN(versionToRelease)) {
    throw new Error("Version to release must be a number.");
  }
  if (versionToRelease < 1 || versionToRelease > 2) {
    throw new Error("Version to release must be between 0 and 2.");
  }

  if (versionToRelease == 1) {
    setPackageName("hre-extender-v1", "@tenderly/hardhat-tenderly");
    setPackageName("hre-extender-v2", "@tenderly/hre-extender-v2");

    setPrivateProperty("hre-extender-v1", false);
    setPrivateProperty("hre-extender-v2", true);
    
    return;
  }

  setPackageName("hre-extender-v1", "@tenderly/hre-extender-v1");
  setPackageName("hre-extender-v2", "@tenderly/hardhat-tenderly");

  setPrivateProperty("hre-extender-v1", true);
  setPrivateProperty("hre-extender-v2", false);
}

function setPackageName(packageDirectoryName: string, packageName: string) {
  const packagePath = path.join('packages', packageDirectoryName, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.name = packageName;

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
}

function setPrivateProperty(packageDirectoryName: string, privateValue: boolean) {
  const packagePath = path.join('packages', packageDirectoryName, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.private = privateValue;

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
}

