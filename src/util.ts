import { HardhatRuntimeEnvironment } from "hardhat/types";

import { TenderlyContract } from "./tenderly/types";

export const getContracts = async (
  hre: HardhatRuntimeEnvironment
): Promise<TenderlyContract[]> => {
  const sourcePaths = await hre.run("compile:solidity:get-source-paths");
  const sourceNames = await hre.run("compile:solidity:get-source-names", {
    sourcePaths
  });
  const data = await hre.run("compile:solidity:get-dependency-graph", {
    sourceNames
  });

  const requestContracts: TenderlyContract[] = [];

  data._resolvedFiles.forEach((resolvedFile, _) => {
    const name = resolvedFile.sourceName
      .split("/")
      .slice(-1)[0]
      .split(".")[0];
    const contractToPush: TenderlyContract = {
      contractName: name,
      source: resolvedFile.content.rawContent,
      sourcePath: resolvedFile.sourceName,
      networks: {},
      compiler: {
        name: "solc",
        version: hre.config.solidity?.compilers[0].version!
      }
    };
    requestContracts.push(contractToPush);
  });
  return requestContracts;
import { Metadata } from "./tenderly/types";

export const resolveDependencies = (
  data: any,
  sourcePath: string,
  metadata: Metadata,
  visited: Record<string, boolean>
): void => {
  if (visited[sourcePath]) {
    return;
  }

  visited[sourcePath] = true;

  data._dependenciesPerFile
    .get(sourcePath)
    .forEach((resolvedDependency, __) => {
      resolveDependencies(
        data,
        resolvedDependency.sourceName,
        metadata,
        visited
      );
      metadata.sources[resolvedDependency.sourceName] = {
        content: resolvedDependency.content.rawContent
      };
    });
};
