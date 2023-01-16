// File: scripts/greeter/automatic.ts
import { ethers } from "hardhat";

export async function main() {
  console.log("🖖🏽[ethers] Deploying and Verifying Greeter in Tenderly");

  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Hardhat!");

  await greeter.deployed();

  console.log("{Greeter} deployed to", greeter.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
