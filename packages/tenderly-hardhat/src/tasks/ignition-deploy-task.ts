import {scope} from "hardhat/config";
import {logger} from "../utils/logger";
import path from "path";
import {HardhatPluginError} from "hardhat/plugins";
import {PLUGIN_NAME} from "../constants";
import {getAccessToken} from "tenderly/utils/config";

import {getVnetTypeByEndpointId, VnetType} from "../tenderly/vnet-type";
import * as URLComposer from "../utils/url-composer";
import {getVerificationInformation, IgnitionError, VerifyInfo} from "@nomicfoundation/ignition-core";
import {getChainId} from "../tenderly/extender";
import {Etherscan} from "@nomicfoundation/hardhat-verify/etherscan";
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
      },
      hre,
      runSuper
    ) => {
      const shouldVerify = process.env.AUTOMATIC_VERIFICATION_ENABLED;
      if (shouldVerify === "true") {
        logger.debug("Automatic verification is enabled, extending ignition deploy task.");
      }
      await runSuper();

      if (!shouldVerify)
        return;

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

      const accessKey = getAccessToken();
      if (accessKey === "") {
        throw new HardhatPluginError(
          PLUGIN_NAME,
          "Tenderly access key is not set. Please set TENDERLY_ACCESS_KEY environment variable.",
        );
      }

      const chainId = await getChainId(hre.network);

      // @ts-ignore
      const endpointId = hre.network.config.url.split("/").pop();
      if (endpointId === undefined) {
        throw new Error(
          "Could not locate the UUID at the end of a Tenderly RPC URL.",
        );
      }

      const vnetType = await getVnetTypeByEndpointId(hre, endpointId);
      if (vnetType === VnetType.NULL_TYPE) {
        throw new Error("Couldn't recognize VnetType from endpoint id.");
      }

      const customChainConfigs = [{
        network: hre.network.name,
        chainId,
        urls: {
          apiURL: URLComposer.composeApiURL(hre, endpointId, chainId, vnetType),
          browserURL: URLComposer.composeBrowserURL(
            hre,
            endpointId,
            chainId,
            vnetType,
          ),
        },
      }]

      try {
        for await (const [
          chainConfig,
          contractInfo,
        ] of getVerificationInformation(
          deploymentDir,
          customChainConfigs,
          false
        )) {
          // @ts-ignore
          const apiKeyAndUrls = getApiKeyAndUrls(
            accessKey,
            chainConfig
          );

          const instance = new Etherscan(...apiKeyAndUrls);

          console.log(
            `Verifying contract "${contractInfo.name}" for network ${chainConfig.network}...`
          );

          const result = await verifyEtherscanContract(instance, contractInfo);

          if (result.type === "success") {
            console.log(
              `Successfully verified contract "${contractInfo.name}" for network ${chainConfig.network}:\n  - ${result.contractURL}`
            );
            console.log("");
          } else {
            if (/already verified/gi.test(result.reason.message)) {
              const contractURL = instance.getContractUrl(contractInfo.address);
              console.log(
                `Contract ${contractInfo.name} already verified on network ${chainConfig.network}:\n  - ${contractURL}`
              );
              console.log("");

            } else {
              throw new HardhatPluginError(
                PLUGIN_NAME,
                `Verification failed. Please run \`hardhat ignition verify ${deploymentId} --include-unrelated-contracts\` to attempt verifying all contracts.`
              );
            }
          }
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

function getApiKeyAndUrls(
  etherscanApiKey: string | Record<string, string>,
  chainConfig: ChainConfig
): [apiKey: string, apiUrl: string, webUrl: string] {
  const apiKey: string =
    typeof etherscanApiKey === "string"
      ? etherscanApiKey
      : etherscanApiKey[chainConfig.network];

  if (apiKey === undefined) {
    throw new HardhatPluginError(
      PLUGIN_NAME,
      `No etherscan API key configured for network ${chainConfig.network}`
    );
  }

  return [apiKey, chainConfig.urls.apiURL, chainConfig.urls.browserURL];
}

async function verifyEtherscanContract(
  etherscanInstance: Etherscan,
  { address, compilerVersion, sourceCode, name, args }: VerifyInfo
): Promise<
  { type: "success"; contractURL: string } | { type: "failure"; reason: Error }
> {
  try {
    const { message: guid } = await etherscanInstance.verify(
      address,
      sourceCode,
      name,
      compilerVersion,
      args
    );

    const verificationStatus = await etherscanInstance.getVerificationStatus(
      guid
    );

    if (verificationStatus.isSuccess()) {
      const contractURL = etherscanInstance.getContractUrl(address);
      return { type: "success", contractURL };
    } else {
      return { type: "failure", reason: new Error(verificationStatus.message) };
    }
  } catch (e) {
    if (e instanceof Error) {
      return { type: "failure", reason: e };
    } else {
      throw e;
    }
  }
}
