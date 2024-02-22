import { DeploymentsExtension, DeployOptions, DeployResult } from "hardhat-deploy/types";
import { TenderlyPlugin } from "@tenderly/hardhat-integration";
import { HardhatRuntimeEnvironment } from "hardhat/types";
export declare function extendHardhatDeploy(hre: HardhatRuntimeEnvironment): void;
export declare function wrapHHDeployments(deployments: DeploymentsExtension, tenderly: TenderlyPlugin): DeploymentsExtension;
export declare function hhDeploy(name: string, options: DeployOptions): Promise<DeployResult>;
//# sourceMappingURL=extend-hardhat-deploy.d.ts.map