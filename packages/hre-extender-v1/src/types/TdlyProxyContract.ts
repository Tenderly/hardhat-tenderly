import { Contract, ethers } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyPlugin } from "@tenderly/hardhat-integration";

export class TdlyProxyContract {
  [key: string]: any;

  private readonly hre: HardhatRuntimeEnvironment;
  private proxyContract: ethers.Contract;

  constructor(
    hre: HardhatRuntimeEnvironment,
    proxyContract: ethers.Contract,
  ) {
    this.hre = hre;
    this.proxyContract = proxyContract;
  }
  
  public async deployed(): Promise<ethers.Contract> {
    const proxyContract = await this.proxyContract.deployed();
    const deployTransaction = this.proxyContract.deployTransaction;
    if (deployTransaction !== undefined && deployTransaction !== null) {
      // verify:verify task should verify the proxy (regardless of proxy type), implementation and all the related contracts.
      // logger.debug("Running hardhat-verify's verify task ");
      await this.hre.run("verify:verify", {
        address: proxyContract.address,
        constructorArguments: [],
      });
    }

    return proxyContract;
  }
}
