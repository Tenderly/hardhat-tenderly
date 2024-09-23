import {scope} from "hardhat/config";
import {logger} from "../logger";
import path from "path";
import {HardhatPluginError} from "hardhat/plugins";
import {PLUGIN_NAME} from "@tenderly/hardhat-integration/dist/constants";
import {getVerificationInformation, IgnitionError} from "@nomicfoundation/ignition-core";
import {ChainConfig} from "@nomicfoundation/hardhat-verify/types";

require("@nomicfoundation/ignition-core");
require("fs-extra");
require("hardhat/config");
require("hardhat/plugins");
require("path");


const ignitionScope = scope(
  "ignition",
  "Deploy your smart contracts using Hardhat Ignition"
);

ignitionScope
  .task("deploy")
  .setAction(
    async (
      {
        deploymentId,
        includeUnrelatedContracts,
      },
      hre,
      runSuper
    ) => {
      await runSuper();

      const shouldVerify = process.env.AUTOMATIC_VERIFICATION_ENABLED;
      if (!shouldVerify)
        return;

      logger.debug("Automatic verification is enabled, extending ignition deploy task.");

      if (deploymentId === undefined || deploymentId === "") {
        throw new HardhatPluginError(
          PLUGIN_NAME,
          "No deployment ID provided, exiting."
        );
      }

      const deploymentDir = path.join(
        // @ts-ignore
        hre.config.paths.ignition,
        "deployments",
        deploymentId
      );

      const customChainConfigs: ChainConfig[] = []
      try {
        for await (const [
          chainConfig,
          contractInfo,
        ] of getVerificationInformation(
          deploymentDir,
          customChainConfigs,
          includeUnrelatedContracts,
        )) {

          await hre.tenderly.verify({
            name: contractInfo.name,
            address: contractInfo.address,
          });

        }
      } catch (e) {
        if (e instanceof IgnitionError) {
          throw new HardhatPluginError(
            PLUGIN_NAME,
            e.message,
            e
          );
        }

        throw e;
      }
    }
  );
