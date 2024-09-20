import { logger } from "./logger";

logger.settings.minLevel = 4;

export * from "@tenderly/hardhat-tenderly";
export { setup } from "./setup";
