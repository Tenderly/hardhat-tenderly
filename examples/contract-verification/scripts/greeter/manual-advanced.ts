// File: scripts/greeter/manual-advanced.ts
import { readFileSync } from "fs";
import { ethers, tenderly } from "hardhat";

export async function main() {
  console.log("🖖🏽[ethers] Deploying and Verifying Greeter in Tenderly");
  // deploy stuff but later pretend it's been deployed ages ago on Ropsten.
  let greeter = await ethers.deployContract("Greeter", ["Hello, Manual Hardhat!"]);

  greeter = await greeter.waitForDeployment();
  const greeterAddress = await greeter.getAddress();
  console.log("Manual Advanced: {Greeter} deployed to", greeterAddress);

  // pretend it's been deployed ages ago on Sepolia in a different deployment.
  // Hence we know NETWORK_ID=11155111 and the address of the contract (calculatorAddress)
  const NETWORK_ID = "11155111";

  await tenderly.verifyMultiCompilerAPI({
    contracts: [
      {
        contractToVerify: "Greeter",
        sources: {
          "contracts/Greeter.sol": {
            name: "Greeter",
            code: readFileSync("contracts/Greeter.sol", "utf-8").toString(),
          },
          "hardhat/console.sol": {
            name: "console",
            code: readFileSync("node_modules/hardhat/console.sol", "utf-8").toString(),
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
          },
        },
        networks: {
          [NETWORK_ID]: {
            address: greeterAddress,
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
