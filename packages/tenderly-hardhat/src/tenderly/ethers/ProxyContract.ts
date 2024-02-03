import { ContractTransactionResponse, ethers } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyPlugin } from "../../type-extensions";
import { logger } from "../../utils/logger";

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
    logger.debug("Waiting for deployment in TdlyProxyContract");

    const proxyContract = await this.proxyContract.waitForDeployment();
    const deploymentTransaction = this.proxyContract.deploymentTransaction();
    if (deploymentTransaction !== undefined && deploymentTransaction !== null) {
      // verify:verify task should verify the proxy (regardless of proxy type) and the implementation.
      console.log("etherscan config:", JSON.stringify((this.hre.config as any).etherscan, null, 2));
      logger.debug("Running hardhat-verify's verify task ");
      await this.hre.run("verify:verify", {
        address: await proxyContract.getAddress(),
        constructorArguments: [],
      });
    }

    return proxyContract;
  }

  public deploymentTransaction(): null | ContractTransactionResponse {
    return this.proxyContract.deploymentTransaction();
  }

  public async getAddress(): Promise<string> {
    return this.nativeContract.getAddress();
  }
}
