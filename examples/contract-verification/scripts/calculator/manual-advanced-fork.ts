// File: scripts/maths/manual-advanced.ts
import { readFileSync } from "fs";
import { tenderly, network } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";
import { deployCalculator, deployMaths } from "./maths-deployment-ethers";

export async function main() {
  const forkID = `${(network.config as HttpNetworkConfig).url}`.split("/").pop() ?? "";

  // 📐 Maths
  const mathsAddress = await deployMaths();
  await tenderly.verify({
    name: "Maths",
    address: mathsAddress,
  });

  // 🧮 Calculator (uses maths)
  const calculatorAddress = await deployCalculator(mathsAddress);
  // const calculatorAddress = "0x85904a6b167973b7d51eec66f420735a3f9a4345";

  await tenderly.verifyForkAPI(
    {
      root: "",
      config: {
        compiler_version: "0.8.17",
        optimizations_used: false,
      },
      contracts: [
        {
          contractName: "Calculator",
          source: readFileSync("contracts/Calculator.sol", "utf-8").toString(),
          sourcePath: "Calculator.sol",
          compiler: {
            version: "0.8.17",
          },
          networks: {
            // important: key is the Fork ID (UUID like string)
            [forkID]: {
              address: calculatorAddress,
              // Link the dependency to the deployed maths contract
              links: {
                Maths: mathsAddress,
              },
            },
          },
        },
        {
          contractName: "Maths",
          source: readFileSync("contracts/libraries/Maths.sol", "utf-8").toString(),
          sourcePath: "libraries/Maths.sol",
          compiler: {
            version: "0.8.17",
          },
          networks: {},
        },
      ],
    },
    process.env.TENDERLY_PROJECT ?? "",
    process.env.TENDERLY_USERNAME ?? "",
    forkID
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
