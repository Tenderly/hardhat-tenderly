import { ethers } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyPlugin } from "../../type-extensions";

export class TdlyProxyContract {
  [key: string]: any;

  private readonly hre: HardhatRuntimeEnvironment;
  private tenderly: TenderlyPlugin;
  private proxyContract: ethers.Contract;

  constructor(hre: HardhatRuntimeEnvironment, tenderly: TenderlyPlugin, proxyContract: ethers.Contract) {
    this.hre = hre;
    this.tenderly = tenderly;
    this.proxyContract = proxyContract;
  }

  public async waitForDeployment(): Promise<ethers.Contract> {
    console.log("Calling TdlyProxyContract.waitForDeployment();");

    console.log("Waiting for proxy deployment.");
    const proxyContract = await this.proxyContract.waitForDeployment();
    const deploymentTransaction = this.proxyContract.deploymentTransaction();
    if (deploymentTransaction !== undefined && deploymentTransaction !== null) {
      // verify:verify task should verify the proxy (regardless of proxy type) and the implementation.
      await this.hre.run("verify:verify", {
        address: await proxyContract.getAddress(),
        constructorArguments: [],
      });
    }

    return proxyContract;
  }
}
