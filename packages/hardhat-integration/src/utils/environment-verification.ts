import axios from "axios";
import { HardhatRuntimeEnvironment, HttpNetworkConfig } from "hardhat/types";

import { ContractByName } from "../tenderly/types";
import { logger } from "./logger";

// Etherscan-compatible response returned by the environment RPC verifier.
// status "1" means the verification succeeded; on failure the reason is in
// `result` (the status endpoint semantics differ, but the verifysourcecode
// POST itself is synchronous on Tenderly).
interface EtherscanResponse {
  status: string;
  message: string;
  result: string;
}

// verifyOnTenderlyEnvironment verifies contracts on a Virtual Environment
// through the Etherscan-compatible verifier served on the environment RPC URL
// itself (`<rpc>/verify`). The RPC URL authenticates the request, so no
// access key or endpoint-ID resolution is needed. It submits the solc
// standard-JSON input from the Hardhat build info, so the server recompiles
// with exactly the project's compiler settings.
export async function verifyOnTenderlyEnvironment(
  hre: HardhatRuntimeEnvironment,
  contracts: ContractByName[],
): Promise<void> {
  const networkConfig = hre.network.config as HttpNetworkConfig;
  const verifierURL = `${networkConfig.url.replace(/\/+$/, "")}/verify`;

  for (const contract of contracts) {
    try {
      await verifyContract(hre, verifierURL, contract);
    } catch (err) {
      logger.error(
        `Verification of contract '${contract.name}' at ${contract.address} failed: ${
          err instanceof Error ? err.message : err
        }`,
      );
      console.log(
        `Failed to verify contract '${contract.name}' at ${contract.address}: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }
  }
}

async function verifyContract(
  hre: HardhatRuntimeEnvironment,
  verifierURL: string,
  contract: ContractByName,
): Promise<void> {
  const artifact = await hre.artifacts.readArtifact(contract.name);
  const fullyQualifiedName = `${artifact.sourceName}:${artifact.contractName}`;

  const buildInfo = await hre.artifacts.getBuildInfo(fullyQualifiedName);
  if (buildInfo === undefined) {
    throw new Error(
      `no build info found for '${fullyQualifiedName}'; run 'npx hardhat compile' and try again`,
    );
  }

  // Clone the compiler input so deploy-time library links can be injected
  // without mutating the cached build info.
  const input = JSON.parse(JSON.stringify(buildInfo.input));
  if (contract.libraries !== undefined && contract.libraries !== null) {
    input.settings.libraries = input.settings.libraries ?? {};
    for (const [libraryName, libraryAddress] of Object.entries(
      contract.libraries,
    )) {
      const libraryArtifact = await hre.artifacts.readArtifact(libraryName);
      input.settings.libraries[libraryArtifact.sourceName] = {
        ...(input.settings.libraries[libraryArtifact.sourceName] ?? {}),
        [libraryName]: libraryAddress,
      };
    }
  }

  const form = new URLSearchParams();
  form.set("module", "contract");
  form.set("action", "verifysourcecode");
  form.set("codeformat", "solidity-standard-json-input");
  form.set("contractaddress", contract.address);
  form.set("contractname", fullyQualifiedName);
  form.set(
    "compilerversion",
    `v${buildInfo.solcLongVersion ?? buildInfo.solcVersion}`,
  );
  form.set("sourceCode", JSON.stringify(input));

  logger.debug(
    `Verifying '${fullyQualifiedName}' at ${contract.address} via ${verifierURL}`,
  );

  const response = await axios.post<EtherscanResponse>(
    `${verifierURL}?module=contract&action=verifysourcecode`,
    form.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );

  const responseData = response.data;
  if (responseData === undefined || responseData === null) {
    throw new Error("verifier returned an empty response");
  }
  if (responseData.status !== "1") {
    throw new Error(responseData.result ?? responseData.message);
  }

  // The verifier answers status "1" even when verification fails; the actual
  // outcome is in `result` ("Unable to locate ContractCode at 0x…", "The
  // address is not a smart contract", the verified address on success).
  // Confirm the ABI is actually stored through checkverifystatus, which
  // returns "Pass - Verified" only for a verified address.
  const statusForm = new URLSearchParams();
  statusForm.set("module", "contract");
  statusForm.set("action", "checkverifystatus");
  statusForm.set("guid", contract.address);
  const statusResponse = await axios.post<EtherscanResponse>(
    `${verifierURL}?module=contract&action=checkverifystatus`,
    statusForm.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );
  if (statusResponse.data?.result !== "Pass - Verified") {
    throw new Error(responseData.result ?? responseData.message);
  }

  console.log(
    `Contract '${contract.name}' at ${contract.address} verified on the Virtual Environment.`,
  );
}
