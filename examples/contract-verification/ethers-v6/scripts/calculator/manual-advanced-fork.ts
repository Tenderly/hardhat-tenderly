// File: scripts/maths/manual-advanced.ts
import { readFileSync } from "fs";
import { tenderly, network } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";
import { deployCalculator, deployMaths } from "./maths-deployment-ethers";

export async function main() {
  const forkID =
    `${(network.config as HttpNetworkConfig).url}`.split("/").pop() ?? "";

  // 📐 Maths
  const mathsAddress = await deployMaths();
  await tenderly.verify({
    name: "Maths",
    address: mathsAddress,
  });

  // 🧮 Calculator (uses maths)
  const calculatorAddress = await deployCalculator(mathsAddress);
  // const calculatorAddress = "0x85904a6b167973b7d51eec66f420735a3f9a4345";

  await tenderly.verifyForkMultiCompilerAPI(
    {
      contracts: [
        {
          contractToVerify: "Calculator",
          sources: {
            "contracts/Calculator.sol": {
              name: "Calculator",
              code: readFileSync(
                "contracts/Calculator.sol",
                "utf-8",
              ).toString(),
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
            version: "0.8.23",
            settings: {
              optimizer: {
                enabled: false,
                runs: 200,
              },
              evmVersion: "paris",
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
            [forkID]: {
              address: calculatorAddress,
            },
          },
        },
      ],
    },
    process.env.TENDERLY_PROJECT ?? "",
    process.env.TENDERLY_USERNAME ?? "",
    forkID,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
