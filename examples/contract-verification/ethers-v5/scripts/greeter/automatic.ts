// File: scripts/greeter/automatic.ts
import { ethers } from "hardhat";

export async function main() {
  console.log("🖖🏽[ethers] Deploying and Verifying Greeter in Tenderly");

  const Greeter = await ethers.getContractFactory("Greeter");
  let greeter = await Greeter.deploy("Hello, Hardhat!");

  greeter = await greeter.deployed();

  const greeterAddress = await greeter.address;
  console.log("{Greeter} deployed to", greeterAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
