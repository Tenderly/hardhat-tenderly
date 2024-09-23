import { ethers } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyPlugin } from "@tenderly/hardhat-integration";

export class TdlyProxyContract {
  [key: string]: any;

  private readonly hre: HardhatRuntimeEnvironment;
  private tenderly: TenderlyPlugin;
  private proxyContract: ethers.Contract;

  constructor(
    hre: HardhatRuntimeEnvironment,
    tenderly: TenderlyPlugin,
    proxyContract: ethers.Contract,
  ) {
    this.hre = hre;
    this.tenderly = tenderly;
    this.proxyContract = proxyContract;
  }

  public async waitForDeployment(): Promise<ethers.Contract> {
    const proxyContract = await this.proxyContract.waitForDeployment();
    const deploymentTransaction = this.proxyContract.deploymentTransaction();
    if (deploymentTransaction !== undefined && deploymentTransaction !== null) {
      // verify:verify task should verify the proxy (regardless of proxy type), implementation and all the related contracts.
      // logger.debug("Running hardhat-verify's verify task ");
      await this.hre.run("verify:verify", {
        address: await proxyContract.getAddress(),
        constructorArguments: [],
      });
    }

    return proxyContract;
  }

  public deploymentTransaction(): null | ethers.ContractTransactionResponse {
    return this.proxyContract.deploymentTransaction();
  }

  public async getAddress(): Promise<string> {
    return this.nativeContract.getAddress();
  }
}
