#! /usr/bin/env node

import { exec as plainExec } from "child_process";
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import { promisify } from "util";
import * as dotenv from "dotenv";
import readline from "readline";
import arg from "arg";

const execPromise = promisify(plainExec);
dotenv.config();

console.log(purpleString("Creating Tenderly Infrastructure"));

const tenderlyConfig = configFromEnv();
const tenderlyConfigFromEnv = Object.assign({}, tenderlyConfig);

type TenderlyConfig = typeof tenderlyConfig;

async function checkAndReadEnvs() {
  const { stderr: whoami } = await execPromise("tenderly whoami");
  const isCliLoggedIn = whoami.indexOf("Username:") != -1;

  const args = arg(
    {
      "--help": Boolean,
      "--project": String,
      "--devnet-template": String,
      "--account": String,
      "--chain-id": String,
      "--access-key": String,
      "--ci": String,
      "--config-dest-path": String,
      "--interactive": Boolean,
    },
    { argv: process.argv.slice(2) }
  );

  if (args["--help"]) {
    console.log();
  }

  // take the args value, if not present revert to the .env file config
  tenderlyConfig.TENDERLY_PROJECT_SLUG = args["--project"] ?? tenderlyConfig.TENDERLY_PROJECT_SLUG;
  tenderlyConfig.TENDERLY_DEVNET_TEMPLATE = args["--devnet-template"] ?? tenderlyConfig.TENDERLY_DEVNET_TEMPLATE;
  tenderlyConfig.TENDERLY_ACCOUNT_ID = args["--account"] ?? tenderlyConfig.TENDERLY_ACCOUNT_ID;
  tenderlyConfig.TENDERLY_DEVNET_CHAIN_ID = args["--chain-id"] ?? tenderlyConfig.TENDERLY_DEVNET_CHAIN_ID;
  tenderlyConfig.TENDERLY_ACCESS_KEY = args["--access-key"] ?? tenderlyConfig.TENDERLY_ACCESS_KEY;
  tenderlyConfig.CI = args["--ci"] === "true" ? "true" : "false" ?? tenderlyConfig.CI;
  tenderlyConfig.TENDERLY_CONFIG_DEST_PATH =
    args["--config-dest-path"] ?? tenderlyConfig.TENDERLY_CONFIG_DEST_PATH ?? ".";

  if (args["--interactive"]) {
    // if no args, then this
    while (
      !tenderlyConfig.TENDERLY_PROJECT_SLUG ||
      !tenderlyConfig.TENDERLY_DEVNET_TEMPLATE ||
      !tenderlyConfig.TENDERLY_DEVNET_CHAIN_ID ||
      !tenderlyConfig.TENDERLY_ACCOUNT_ID
    ) {
      let k: keyof typeof tenderlyConfig;
      for (k in tenderlyConfig) {
        if (!tenderlyConfig[k]) {
          if (
            (k != "TENDERLY_ACCESS_KEY" && k != "TENDERLY_DEVNET_URL") ||
            (k == "TENDERLY_ACCESS_KEY" && !isCliLoggedIn && !tenderlyConfig.TENDERLY_ACCESS_KEY)
          )
            tenderlyConfig[k] = await read(k);
        }
      }
    }
    configReads.close();
  }
}

(async function spawnAndUpdateConfig() {
  await checkAndReadEnvs();

  const devNetRpc = await spawnADevNet();
  console.log("New DevNet\n\t", purpleString(devNetRpc));
  tenderlyConfig.TENDERLY_DEVNET_URL = devNetRpc;
  // Unless a https is present, it's likely an error in running the command
  if (devNetRpc.indexOf("https") != 0) {
    console.error("Spawning failed " + devNetRpc);
  } else {
    networkForFrontEnd(tenderlyConfig);
    updateEnvFile(tenderlyConfig);
    process.exit(0);
  }
})();

async function spawnADevNet() {
  if (tenderlyConfig.CI === "true" || !!tenderlyConfig.TENDERLY_ACCESS_KEY) {
    console.log("Using environment variables to authenticate with Tenderly");
    const cliSpawnCommand = `tenderly devnet spawn-rpc --project ${tenderlyConfig.TENDERLY_PROJECT_SLUG} --template ${tenderlyConfig.TENDERLY_DEVNET_TEMPLATE} --account ${tenderlyConfig.TENDERLY_ACCOUNT_ID}  --access_key ${tenderlyConfig.TENDERLY_ACCESS_KEY}`;
    console.log("Spawning a DevNet \n\t", cliSpawnCommand);
    // Note: Tenderly CLI unfortunately outputs to stderr by default, so we have to take stderr
    const { stderr } = await execPromise(cliSpawnCommand);
    return stderr.trim();
  } else {
    if (!!tenderlyConfig.TENDERLY_PROJECT_SLUG && !!tenderlyConfig.TENDERLY_DEVNET_TEMPLATE) {
      const cliSpawnCommand = `tenderly devnet spawn-rpc --project ${tenderlyConfig.TENDERLY_PROJECT_SLUG} --account ${tenderlyConfig.TENDERLY_ACCOUNT_ID} --template ${tenderlyConfig.TENDERLY_DEVNET_TEMPLATE}`;
      console.log("Relying on tenderly CLI to authenticate with Tenderly. Run `tenderly whoami` to check.");
      console.log("Spawning \n\t", cliSpawnCommand);
      // Note: Tenderly CLI unfortunately outputs to stderr by default, so we have to take stderr
      const { stderr } = await execPromise(cliSpawnCommand);
      return stderr.trim();
    }
  }
  throw Error("Must specify the following config in your .env file\n" + ENV_FILE_TEMPLATE);
}

function networkForFrontEnd(tenderlyConfig: TenderlyConfig) {
  console.log("Updated Tenderly infrastructure configuration available in tenderly.config.ts");
  writeFileSync("./tenderly.config.ts", tenderlyConfigTsFile(tenderlyConfig));

  if (tenderlyConfig.TENDERLY_CONFIG_DEST_PATH && tenderlyConfig.TENDERLY_CONFIG_DEST_PATH != ".") {
    console.log("Copying network config to " + tenderlyConfig.TENDERLY_CONFIG_DEST_PATH);
    copyFileSync("./tenderly.config.ts", tenderlyConfig.TENDERLY_CONFIG_DEST_PATH);
  }
}

function updateEnvFile(tenderlyConfig: TenderlyConfig) {
  if (!existsSync(".env")) {
    writeFileSync(".env", ENV_FILE_TEMPLATE);
  }

  const envFile = readFileSync(".env");

  let adaptedEnvFile = envFile.toString();

  // if there's no Tenderly config in there

  const incompleteConfigInEnvFile =
    Object.values(tenderlyConfigFromEnv).filter((it) => !it).length < Object.values(tenderlyConfig).length;

  // append the whole Tenderly config template if at least one key is missing and the header is not there
  if (incompleteConfigInEnvFile && adaptedEnvFile.indexOf("## Tenderly config") == -1) {
    adaptedEnvFile += "\n" + ENV_FILE_TEMPLATE;
  }

  let tenderlyConfigKey: keyof typeof tenderlyConfig;
  for (tenderlyConfigKey in tenderlyConfig) {
    const envConfigLine = new RegExp(`^${tenderlyConfigKey}=.*`, "gm");
    // assignment (empty assignment if value is undeifined)
    const configAssignment = `${tenderlyConfigKey}=${tenderlyConfig[tenderlyConfigKey] ?? ""}`;
    if (!adaptedEnvFile.match(envConfigLine)) {
      adaptedEnvFile += "\n" + configAssignment;
    } else {
      adaptedEnvFile = adaptedEnvFile.replace(envConfigLine, configAssignment);
    }
  }

  writeFileSync(".env", adaptedEnvFile);

  // TODO: not sure if we should remove this outside of scaffoldeth.
  if (existsSync("deployments/tenderly")) {
    rmSync("deployments/tenderly", { recursive: true });
  }
}

function configFromEnv() {
  const {
    TENDERLY_PROJECT_SLUG,
    TENDERLY_DEVNET_TEMPLATE,
    TENDERLY_DEVNET_CHAIN_ID,
    TENDERLY_ACCOUNT_ID,
    TENDERLY_ACCESS_KEY,
    CI,
    TENDERLY_CONFIG_DEST_PATH,
  } = process.env;
  return {
    TENDERLY_PROJECT_SLUG,
    TENDERLY_DEVNET_TEMPLATE,
    TENDERLY_DEVNET_CHAIN_ID,
    TENDERLY_ACCOUNT_ID,
    TENDERLY_ACCESS_KEY,
    CI: CI,
    TENDERLY_DEVNET_URL: "",
    TENDERLY_CONFIG_DEST_PATH: ".",
  };
}

const configReads = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function read(envVar: keyof TenderlyConfig): Promise<string> {
  return new Promise((resolve) => {
    let prompt: string = envVar;

    switch (envVar) {
      case "TENDERLY_ACCOUNT_ID":
        prompt = envVar + " (the project owner: username or org name)";
        break;
      case "CI":
        prompt = envVar + " (true/false)";
        break;
    }

    configReads.question(purpleString(prompt + ":"), (answer) => {
      resolve(answer);
    });
  });
}

function tenderlyConfigTsFile(tenderlyConfig: TenderlyConfig) {
  return `const config = {
  "devNet": {
    "rpcUrl": "${tenderlyConfig.TENDERLY_DEVNET_URL}",
    "chainId": ${tenderlyConfig.TENDERLY_DEVNET_CHAIN_ID},
    "name": "DevNet @ ${tenderlyConfig.TENDERLY_DEVNET_TEMPLATE}"
  },
  "access": {
    "project": "${tenderlyConfig.TENDERLY_PROJECT_SLUG}",
    "accountId": "${tenderlyConfig.TENDERLY_ACCOUNT_ID}"
  }
}

export default config;`;
}

const ENV_FILE_TEMPLATE = `## Tenderly config

# Tenderly access & project
# https://docs.tenderly.co/other/platform-access/how-to-find-the-project-slug-username-and-organization-name
TENDERLY_ACCOUNT_ID=
TENDERLY_PROJECT_SLUG=

# Tenderly Access Token. Optional if tenderly cli is authenticated. Run \`tenderly whoami\` to check
# https://docs.tenderly.co/other/platform-access/how-to-generate-api-access-tokens
TENDERLY_ACCESS_KEY=

# Tenderly DevNet
TENDERLY_DEVNET_TEMPLATE=
TENDERLY_DEVNET_CHAIN_ID=
TENDERLY_DEVNET_URL=

CI=
`;

function purpleString(prompt: string) {
  return `\x1b[1m\x1b[35m${prompt}\x1b[0m `;
}
