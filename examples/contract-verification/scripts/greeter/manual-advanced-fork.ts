import { readFileSync } from "fs";
import { network, ethers, tenderly } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";

export async function main() {
  const forkID =
    `${(network.config as HttpNetworkConfig).url}`.split("/").pop() ?? "";

  console.log("🖖🏽[ethers] Deploying and Verifying Greeter in Tenderly");

  let greeter = await ethers.deployContract("Greeter", [
    "Hello, Manual Hardhat on Fork !",
  ]);

  greeter = await greeter.waitForDeployment();
  const greeterAddress = await greeter.getAddress();
  console.log("Manual Advanced (fork): {Greeter} deployed to", greeterAddress);

  await tenderly.verifyForkMultiCompilerAPI(
    {
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
              code: readFileSync(
                "node_modules/hardhat/console.sol",
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
            },
          },
          networks: {
            [forkID]: {
              address: greeterAddress,
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
