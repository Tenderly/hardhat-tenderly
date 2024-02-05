// File: scripts/greeter/manual-simple-public.ts
import { ethers, tenderly } from "hardhat";

async function main() {
  console.log("🖖🏽[ethers] Deploying and Verifying Greeter in Tenderly");

  let greeter = await ethers.deployContract("Greeter", [
    "Hello, Manual Hardhat!",
  ]);

  greeter = await greeter.waitForDeployment();
  const address = await greeter.getAddress();
  console.log("Manual Simple: {Greeter} deployed to:", address);

  await tenderly.verify({
    address,
    name: "Greeter",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
