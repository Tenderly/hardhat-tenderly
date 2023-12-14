#! /usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

main();

function main() {
  let updatedConfig = getHardhatConfigObject();
  updatedConfig = updateNetworks(updatedConfig);
  updatedConfig = appendTenderlyProjectConfig(updatedConfig);

  let updatedHardhatFile = hardHatConfigFileContent().replace(/(.*config.*?=)\s+\{(\s|.)*};/gm, updatedConfig);
  updatedHardhatFile = addImportAndInitPlugin(updatedHardhatFile);
  updatedHardhatFile = updatedHardhatFile.replace(/\n\n\n/gm, "\n\n");
  writeFileSync(hardhatFileName(), updatedHardhatFile);
  console.info(`Tenderly in ${hardhatFileName()}setup complete`);
  console.info("Installing @tenderly/hardhat-tenderly and dotenv");
  installNpmLibs();
}

/**
 * Inserts the import of tenderly plugin
 * @param updatedConfig
 */
function addImportAndInitPlugin(updatedConfig: string) {
  if (updatedConfig.indexOf("@tenderly/hardhat-tenderly") != -1) {
    return updatedConfig;
  }
  const configLines = updatedConfig.split("\n");
  const lastImportLine = configLines
    .map((line, idx) => {
      return line.indexOf("import") == 0 ? idx : -1;
    })
    .filter((idx) => idx > -1)
    .reverse()[0];

  updatedConfig = [
    "import * as tenderly from '@tenderly/hardhat-tenderly'",
    ...configLines.slice(0, lastImportLine + 1),
    "\n\ntenderly.setup ({ automaticVerifications: true });\n",
    configLines.slice(lastImportLine + 1).join("\n"),
  ].join("\n");
  updatedConfig = updatedConfig.replace(/\n\n/gm, "\n");
  return updatedConfig;
}

function findNetworksSpacing(configObject: string, tag: string) {
  const configLines = configObject.split("\n");
  let networkSpace = "  ";
  const regex = new RegExp(`(?<spacer>\\s+)${tag}:`, "gm");
  const networksSpacing = configLines
    .map((line) => {
      const grps = regex.exec(line);
      if (grps && grps.groups) {
        return grps.groups["spacer"];
      }
      return false;
    })
    .filter((grp) => grp !== false);

  if (networksSpacing.length > 0 && networksSpacing[0] !== false) {
    networkSpace = networksSpacing[0];
  }
  return networkSpace;
}

function appendTenderlyProjectConfig(updatedConfig: string) {
  const hardhatConfig = getHardhatConfigObject();

  if (!hardhatConfig) {
    return updatedConfig;
  }
  const configLines = updatedConfig.split("\n");
  const networksSpacing = findNetworksSpacing(updatedConfig, "networks");

  const tenderlyConfigMatch = hardhatConfig.match(
    /(?<tenderlyIndent>\s+)tenderly\s*:(\s*\{(\s|.)*?\k<tenderlyIndent>},?)/gm
  );
  const hasTenderlyProjectConfigured = !!tenderlyConfigMatch && isTenderlyProjectConfigured(tenderlyConfigMatch);

  if (!hasTenderlyProjectConfigured) {
    // needs the config
    console.debug("Appends Tenderly project config");
    updatedConfig =
      "\n" +
      [
        ...configLines.slice(0, configLines.length - 1),
        ",", // perhaps there's no comma on the last field
        tenderlyProjectConfig(networksSpacing),
        ...configLines.slice(configLines.length - 1),
      ].join("\n");
  }
  return sanitizeConfig(updatedConfig);
}

function sanitizeConfig(config: string) {
  return config
    .replace(/\n,/gm, ",\n")
    .replace(/,(\n|\s)*,/gm, ",")
    .replace(/}(\n|\s)*,/gm, "},")
    .replace(/\n\n/gm, "\n");
}

function getHardhatConfigObject() {
  const configObject = hardHatConfigFileContent().match(/(.*config.*?=)\s+\{(\s|.)*};/gm);
  if (configObject) {
    return configObject[0];
  }
  throw Error("Couldn't process the hardhat file");
}

function updateNetworks(updatedConfig: string) {
  const hardhatConfigObject = getHardhatConfigObject();
  const networksMatch = hardhatConfigObject.match(
    /(?<networksIndent>\s+)networks\s*:(\s*\{(\s|.)*?\k<networksIndent>},?)/gm
  );

  if (networksMatch) {
    console.debug("has networks match");
    let updatedNetworks = networksMatch[0];

    const networks = networksMatch[0];
    const noTenderlyNetworkConfigPresent = networks.indexOf("tenderly") == -1;
    if (noTenderlyNetworkConfigPresent) {
      const networksLines = networks.split("\n");
      const networksPrepend = networksLines[networksLines.length - 1].split("}")[0];

      const extendedNetworksLines = [
        ...networksLines.slice(0, networksLines.length - 1),
        ",", // perhaps there's no comma on the last field
        tenderlyNetworkConfig(networksPrepend),
        networksLines[networksLines.length - 1],
      ].join("\n");
      console.debug("Updated hardhat config by adding tenderly network");
      updatedNetworks = sanitizeConfig(extendedNetworksLines);
    } else {
      console.debug("Will update existing tenderly network config");
      // throw Error("Not implemented yet");
    }
    updatedConfig = updatedConfig.replace(
      /(?<networksIndent>\s+)networks\s*:(\s*\{(\s|.)*?\k<networksIndent>},?)/gm,
      updatedNetworks
    );
  } else {
    console.debug("Adding networks to config");
    const configSpacing = findNetworksSpacing(updatedConfig, "solidity");

    const networksConfig = `
${configSpacing}networks: {
${tenderlyNetworkConfig(configSpacing)}
${configSpacing}},
    `;

    const configLines = updatedConfig.split("\n");
    updatedConfig = [
      ...configLines.slice(0, configLines.length - 1),
      networksConfig,
      ...configLines.slice(configLines.length - 1),
    ]
      .join("\n")
      .replace(/\n,/gm, ",\n")
      .replace(/,(\n|\s)*,/gm, ",")
      .replace(/}(\n|\s)*,/gm, "},")
      .replace(/,,/gm, ",")
      .replace(/\n\n/gm, "\n");
  }
  console.debug("Network config complete");
  return updatedConfig;
}

function hardHatConfigFileContent() {
  return readFileSync(hardhatFileName()).toString();
}

function hardhatFileName() {
  if (existsSync("hardhat.config.ts")) {
    return "hardhat.config.ts";
  } else {
    if (existsSync("hardhat.config.js")) {
      return "hardhat.config.js";
    }
  }
  throw Error("No hardhat.config.(ts|js) found");
}

function tenderlyNetworkConfig(indentSize: string) {
  return `${indentSize}${indentSize}tenderly: {
${indentSize}${indentSize}${indentSize}url: process.env.TENDERLY_DEVNET_RPC || "",
${indentSize}${indentSize}${indentSize}chainId: Number.parseInt(process.env.TENDERLY_DEVNET_CHAIN_ID || "-1"),
${indentSize}${indentSize}},`;
}

function tenderlyProjectConfig(indentSize: string) {
  return `${indentSize}tenderly: {
${indentSize}${indentSize}project: process.env.TENDERLY_PROJECT_SLUG || "",
${indentSize}${indentSize}username: process.env.TENDERLY_ACCOUNT_ID || "",
${indentSize}${indentSize}privateVerification: true,
${indentSize}}`;
}

function isTenderlyProjectConfigured(tenderlyConfigMatch: RegExpMatchArray) {
  const projectMatches = tenderlyConfigMatch
    ?.map((tenderlyMatch) => {
      return tenderlyMatch.match(/\s+project:/gm);
    })
    ?.filter((hasMatch) => hasMatch);

  return projectMatches && projectMatches.length > 0;
}

function installNpmLibs() {
  if (existsSync("package-lock.json")) {
    execSync("npm i -D @tenderly/hardhat-tenderly dotenv", { stdio: "inherit" });
  }
  if (existsSync("yarn.lock")) {
    execSync("yarn add -D @tenderly/hardhat-tenderly dotenv", { stdio: "inherit" });
  }
  if (existsSync("pnpm.lock")) {
    execSync("pnpm add -D @tenderly/hardhat-tenderly dotenv", { stdio: "inherit" });
  }
}
