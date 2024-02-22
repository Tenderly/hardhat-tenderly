// File: scripts/greeter/automatic.ts
import { ethers } from "hardhat";

export async function main() {
  console.log("🖖🏽[ethers] Deploying and Verifying Greeter in Tenderly");

  let greeter = await ethers.deployContract("Greeter", ["Hello, Hardhat!"]);

  greeter = await greeter.waitForDeployment();

  const greeterAddress = await greeter.getAddress();
  console.log("{Greeter} deployed to", greeterAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
