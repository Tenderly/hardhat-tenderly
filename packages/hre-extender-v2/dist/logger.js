"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const tslog_1 = require("tslog");
const logger = new tslog_1.Logger({
    prettyLogTemplate: "{{dateIsoStr}} {{logLevelName}} {{name}} =>",
    name: "HreExtender",
});
exports.logger = logger;
logger.settings.minLevel = 4; // info level
if (process.env.TENDERLY_VERBOSE_LOGGING === "true") {
    logger.settings.minLevel = 1; // trace level
}
//# sourceMappingURL=logger.js.map