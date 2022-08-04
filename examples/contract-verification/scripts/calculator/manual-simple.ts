// File: scripts/maths/manual-simple.ts
import { tenderly } from "hardhat";
import { deployCalculator, deployMaths } from "./maths-deployment-ethers";

async function main() {
  // 📐 Calculator (uses maths)
  const mathsAddress = await deployMaths();

  console.log("📐[ethers] Verifying Maths in Tenderly");

  await tenderly.verify({
    name: "Maths",
    address: mathsAddress,
  });

  // 🧮 Calculator (uses maths)
  const calculatorAddress = await deployCalculator(mathsAddress);

  console.log("🧮[tenderly] Verifying Calculator in Tenderly");

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
