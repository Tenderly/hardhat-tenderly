// File: scripts/greeter/manual-simple-public.ts
import { ethers, tenderly } from "hardhat";

async function main() {
  console.log("🖖🏽[ethers] Deploying and Verifying Greeter in Tenderly");

  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Manual Hardhat!");

  await greeter.deployed();
  const address = greeter.address;
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
