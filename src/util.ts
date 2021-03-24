import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Metadata, TenderlyContract } from "./tenderly/types";

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
};

export const resolveDependencies = (
  dependencyData: any,
  sourcePath: string,
  metadata: Metadata,
  visited: Record<string, boolean>
): void => {
  if (visited[sourcePath]) {
    return;
  }

  visited[sourcePath] = true;

  dependencyData._dependenciesPerFile
    .get(sourcePath)
    .forEach((resolvedDependency, __) => {
      resolveDependencies(
        dependencyData,
        resolvedDependency.sourceName,
        metadata,
        visited
      );
      metadata.sources[resolvedDependency.sourceName] = {
        content: resolvedDependency.content.rawContent
      };
    });
};
