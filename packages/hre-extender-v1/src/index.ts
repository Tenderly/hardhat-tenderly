import { logger } from "./logger";

logger.settings.minLevel = 4;

export * from "@tenderly/hardhat-integration";
export { setup } from "./setup";
