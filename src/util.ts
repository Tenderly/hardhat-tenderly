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
