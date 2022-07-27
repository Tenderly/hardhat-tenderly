// File: scripts/maths/automatic.ts
import { tenderly } from "hardhat";
import { deployCalculator, deployMaths } from "./maths-deployment-ethers";

async function main() {
  // 📐 Maths (uses maths)
  console.log("📐 [tenderly] Deploying & autoverifying Maths in Tenderly");
  const mathsAddress = await deployMaths();

  // 🧮 Calculator (uses maths)
  const calculatorAddress = await deployCalculator(mathsAddress);

  console.log("🧮[tenderly] Deploying & autoverifying in Tenderly");

  tenderly.verify({
    name: "Calculator",
    address: calculatorAddress,
    libraries: {
      Maths: mathsAddress,
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
