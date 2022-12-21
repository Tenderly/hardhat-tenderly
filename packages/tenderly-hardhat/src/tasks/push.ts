import { task } from "hardhat/config";

import { HardhatRuntimeEnvironment } from "hardhat/types";

task("tenderly:push", "Verifies contracts on Tenderly based on the configuration in hardhat.config.js.")
  .addOptionalVariadicPositionalParam(
    "contracts",
    "Addresses and names of contracts that will be verified formatted ContractName=Address"
  )
  .setAction(pushContracts);

async function pushContracts({ contracts }: any, hre: HardhatRuntimeEnvironment) {
  await hre.run("tenderly:verify", { contracts });
}
