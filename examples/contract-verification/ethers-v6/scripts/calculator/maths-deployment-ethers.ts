// File: scripts/maths/maths-deployment-ethers.ts
import { ethers } from "hardhat";

export async function deployMaths() {
  console.log("📐[ethers] Deploying Maths library");
  let maths = await ethers.deployContract("Maths");
  maths = await maths.waitForDeployment();

  console.log("📐[ethers] {Maths} deployed to", await maths.getAddress());

  return await maths.getAddress();
}

export async function deployCalculator(mathsAddress: string) {
  console.log("🧮[ethers] Deploying Calculator smart contract");
  let calculator = await ethers.deployContract("Calculator", {
    libraries: {
      Maths: mathsAddress,
    },
  });
  calculator = await calculator.waitForDeployment();

  console.log(
    "🧮[ethers] {Calculator} deployed to",
    await calculator.getAddress(),
  );
  return await calculator.getAddress();
}
