// File: scripts/maths/maths-deployment-ethers.ts
import { ethers } from "hardhat";

export async function deployMaths() {
  const Maths = await ethers.getContractFactory("Maths");
  console.log("📐[ethers] Deploying Maths library");
  const maths = await Maths.deploy();
  await maths.deployed();

  console.log("📐[ethers] {Maths} deployed to", maths.address);

  return maths.address;
}

export async function deployCalculator(mathsAddress: string) {
  const Calculator = await ethers.getContractFactory("Calculator", {
    libraries: {
      Maths: mathsAddress,
    },
  });
  console.log("🧮[ethers] Deploying Calculator smart contract");
  const calculator = await Calculator.deploy();
  await calculator.deployed();
  const calculatorAddress = calculator.address;

  console.log("🧮[ethers] {Calculator} deployed to", calculator.address);
  return calculator.address;
}
