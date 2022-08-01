// File: scripts/greeter/manual-simple-public.ts
import { ethers, tenderly } from "hardhat";

async function main() {
  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Manual Hardhat!");

  await greeter.deployed();
  const address = greeter.address;
  console.log("Manual Advanced: {Greeter} deployed to:", address);

  tenderly.verify({
    address,
    name: "Greeter",
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
