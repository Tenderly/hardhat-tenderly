// File: scripts/greeter/manual-advanced-fork.ts
import { readFileSync } from "fs";
import { ethers, tenderly } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const FORK_ID = process.env.TENDERLY_FORK_ID || "";

export async function main() {
  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Manual Hardhat on Fork !");

  await greeter.deployed();
  const greeterAddress = greeter.address;
  console.log("Manual Advanced (fork): {Greeter} deployed to", greeterAddress);

  tenderly.verifyForkAPI(
    {
      config: {
        compiler_version: "0.8.9",
        evm_version: "default",
        optimizations_count: 200,
        optimizations_used: false,
      },
      root: "",
      contracts: [
        {
          contractName: "Greeter",
          source: readFileSync("contracts/Greeter.sol", "utf-8").toString(),
          sourcePath: "contracts/whatever/Greeter.sol",
          networks: {
            // important: key is the Fork ID (UUID-like string)
            [FORK_ID]: {
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
    },
    process.env.TENDERLY_PROJECT || "",
    process.env.TENDERLY_USERNAME || "",
    FORK_ID
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
