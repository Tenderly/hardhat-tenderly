// File: scripts/maths/automatic.ts
import { deployCalculator, deployMaths } from "./maths-deployment-ethers";

async function main() {
  // 📐 Maths (uses maths)
  console.log("📐[tenderly] Deploying & autoverifying Maths in Tenderly");
  const mathsAddress = await deployMaths();

  // 🧮 Calculator (uses maths)
  console.log("🧮[tenderly] Deploying & autoverifying Calculator in Tenderly");
  await deployCalculator(mathsAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
