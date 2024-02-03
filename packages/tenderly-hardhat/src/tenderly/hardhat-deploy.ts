import {
  DeploymentsExtension,
  DeployOptions,
  DeployResult,
} from "hardhat-deploy/types";

import { TenderlyPlugin } from "../type-extensions";

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
