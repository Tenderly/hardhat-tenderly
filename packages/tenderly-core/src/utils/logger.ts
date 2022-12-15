import { Logger } from "tslog";

export const logger = new Logger({
  prettyLogTemplate: "{{dateIsoStr}} {{logLevelName}} {{name}} =>",
  name: "Service",
});
