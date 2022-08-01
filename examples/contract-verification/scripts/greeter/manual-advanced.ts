// File: scripts/greeter/manual-advanced.ts
import { readFileSync } from "fs";
import { ethers, tenderly } from "hardhat";

export async function main() {
  // deploy stuff but later pretend it's been deployed ages ago on Ropsten.
  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Manual Hardhat!");

  await greeter.deployed();
  const greeterAddress = greeter.address;
  console.log("Manual Simple: {Greeter} deployed to", greeterAddress);

  // pretend it's been deployed ages ago on Ropsten in a different deployment.
  // Hence we know NETWORK_ID=3 and the address of the contract (greeterAddress)
  const NETWORK_ID = 3;

  await tenderly.verifyAPI({
    config: {
      compiler_version: "0.8.9",
      evm_version: "default",
      optimizations_count: 200,
      optimizations_used: false,
    },
    contracts: [
      {
        contractName: "Greeter",
        source: readFileSync("contracts/Greeter.sol", "utf-8").toString(),
        sourcePath: "contracts/whatever/Greeter.sol",
        networks: {
          // The key is the network ID (1 for Mainnet, 3 for Ropsten and so on)
          [NETWORK_ID]: {
            address: greeterAddress,
            links: {},
          },
        },
      },
      {
        contractName: "console",
        source: readFileSync(
          "node_modules/hardhat/console.sol",
          "utf-8"
        ).toString(),
        sourcePath: "hardhat/console.sol",
        networks: {},
        compiler: {
          name: "solc",
          version: "0.8.9",
        },
      },
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
