import { readFileSync } from "fs";
import { network, ethers, tenderly } from "hardhat";
import { HttpNetworkConfig } from "hardhat/types";

export async function main() {
  const forkID = `${(network.config as HttpNetworkConfig).url}`.split("/").pop() ?? "";

  console.log("🖖🏽[ethers] Deploying and Verifying Greeter in Tenderly");
  
  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Manual Hardhat on Fork !");

  await greeter.deployed();
  const greeterAddress = greeter.address;
  console.log("Manual Advanced (fork): {Greeter} deployed to", greeterAddress);

  await tenderly.verifyForkAPI(
    {
      config: {
        compiler_version: "0.8.17",
        evm_version: "default",
        optimizations_count: 200,
        optimizations_used: false,
      },
      root: "",
      contracts: [
        {
          contractName: "Greeter",
          source: readFileSync("contracts/Greeter.sol", "utf-8").toString(),
          sourcePath: "contracts/Greeter.sol",
          networks: {
            // important: key is the Fork ID (UUID-like string)
            [forkID]: {
              address: greeterAddress,
              links: {},
            },
          },
        },
        {
          contractName: "console",
          source: readFileSync("node_modules/hardhat/console.sol", "utf-8").toString(),
          sourcePath: "hardhat/console.sol",
          networks: {},
          compiler: {
            name: "solc",
            version: "0.8.17",
          },
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
