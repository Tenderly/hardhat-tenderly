import {
  DeploymentsExtension,
  DeployOptions,
  DeployResult,
} from "hardhat-deploy/types";

import { TenderlyPlugin } from "@tenderly/hardhat-tenderly";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export function extendHardhatDeploy(hre: HardhatRuntimeEnvironment): void {
  // ts-ignore is needed here because we want to avoid importing hardhat-deploy in order not to cause duplicated initialization of the .deployments field
  if (
    "deployments" in hre &&
    // @ts-ignore
    hre.deployments !== undefined &&
    "tenderly" in hre &&
    // @ts-ignore
    hre.tenderly !== undefined
  ) {
    // @ts-ignore
    hre.deployments = wrapHHDeployments(hre.deployments, hre.tenderly);
  }
}

export function wrapHHDeployments(
  deployments: DeploymentsExtension,
  tenderly: TenderlyPlugin,
) {
  deployments.deploy = wrapDeploy(deployments.deploy, tenderly);

  return deployments;
}

export declare function hhDeploy(
  name: string,
  options: DeployOptions,
): Promise<DeployResult>;

function wrapDeploy(
  deployFunc: typeof hhDeploy,
  tenderly: TenderlyPlugin,
): typeof hhDeploy {
  return async function (
    name: string,
    options: DeployOptions,
  ): Promise<DeployResult> {
    const depResult = await deployFunc(name, options);
    await tenderly.verify({
      name,
      address: depResult.address,
    });

    return depResult;
  };
}
