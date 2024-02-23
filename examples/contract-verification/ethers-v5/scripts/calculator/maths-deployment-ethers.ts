// File: scripts/maths/maths-deployment-ethers.ts
import { ethers } from "hardhat";

export async function deployMaths() {
  console.log("📐[ethers] Deploying Maths library");
  
  const Maths = await ethers.getContractFactory("Maths");
  let maths = await Maths.deploy();
  maths = await maths.deployed();

  console.log("📐[ethers] {Maths} deployed to", await maths.address);

  return maths.address;
}

export async function deployCalculator(mathsAddress: string) {
  console.log("🧮[ethers] Deploying Calculator smart contract");
  const Calculator = await ethers.getContractFactory("Calculator", {
    libraries: {
      Maths: mathsAddress,
    },
  });
  
  let calculator = await Calculator.deploy();
  calculator = await calculator.deployed();

  console.log(
    "🧮[ethers] {Calculator} deployed to",
    await calculator.address,
  );
  return calculator.address;
}
