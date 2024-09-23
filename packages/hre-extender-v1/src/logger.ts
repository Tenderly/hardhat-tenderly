import { Logger } from "tslog";
import * as dotenv from "dotenv";

dotenv.config();

const logger = new Logger({
  prettyLogTemplate: "{{dateIsoStr}} {{logLevelName}} {{name}} =>",
  name: "HreExtender",
});

logger.settings.minLevel = 4; // info level
if (process.env.TENDERLY_VERBOSE_LOGGING === "true") {
  logger.settings.minLevel = 1; // trace level
}

export { logger };
