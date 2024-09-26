const fs = require("fs");

main();

function main() {
  setLinkPathForDependency("link:../../../packages/hre-extender-v2");
}

function setLinkPathForDependency(linkPath) {
  const packageJson = JSON.parse(fs.readFileSync("package.json", 'utf8'));
  packageJson.dependencies["@tenderly/hardhat-tenderly"] = linkPath;
  
  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2), 'utf8');
}
