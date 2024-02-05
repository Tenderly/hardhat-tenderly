// File: scripts/maths/manual-advanced.ts
import { readFileSync } from "fs";
import { tenderly } from "hardhat";
import { deployCalculator, deployMaths } from "./maths-deployment-ethers";

export async function main() {
  // deploy stuff but later pretend it's been deployed ages ago on Sepolia.
  // 📐 Maths
  const mathsAddress = await deployMaths();
  await tenderly.verify({
    name: "Maths",
    address: mathsAddress,
  });

  // 🧮 Calculator (uses maths)
  const calculatorAddress = await deployCalculator(mathsAddress);

  // pretend it's been deployed ages ago on Sepolia in a different deployment.
  // Hence we know NETWORK_ID=11155111 and the address of the contract (calculatorAddress)
  const NETWORK_ID = "11155111";

  await tenderly.verifyMultiCompilerAPI({
    contracts: [
      {
        contractToVerify: "Calculator",
        sources: {
          "contracts/Calculator.sol": {
            name: "Calculator",
            code: readFileSync("contracts/Calculator.sol", "utf-8").toString(),
          },
          "hardhat/console.sol": {
            name: "console",
            code: readFileSync(
              "node_modules/hardhat/console.sol",
              "utf-8",
            ).toString(),
          },
          "contracts/libraries/Maths.sol": {
            name: "Maths",
            code: readFileSync(
              "contracts/libraries/Maths.sol",
              "utf-8",
            ).toString(),
          },
        },
        // solidity format compiler with a little modification at libraries param
        compiler: {
          version: "0.8.17",
          settings: {
            optimizer: {
              enabled: false,
              runs: 200,
            },
            libraries: {
              "contracts/libraries/Maths.sol": {
                // WARNING: Beware of the addresses parameter
                // To see the explanation of why you need to put the addresses parameter, see the following link: https://docs.tenderly.co/monitoring/smart-contract-verification/verifying-contracts-using-the-tenderly-hardhat-plugin/manual-contract-verification
                addresses: {
                  Maths: mathsAddress,
                },
              },
            },
          },
        },
        networks: {
          [NETWORK_ID]: {
            address: calculatorAddress,
          },
        },
      },
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
