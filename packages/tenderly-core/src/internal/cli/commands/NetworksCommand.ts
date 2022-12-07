import Table from "cli-table3";
import commander from "commander";
import { logger } from "../../../utils/logger";

import { PLUGIN_NAME } from "../../../common/constants";
import { TenderlyService } from "../../core/services";
import { TenderlyNetwork } from "../../core/types";

const tenderlyService = new TenderlyService(PLUGIN_NAME);

export const NetworksCommand = new commander.Command("networks")
  .description("list all Tenderly supported networks")
  .option("-v, --verbose", "display detailed network information")
  .action(async (options) => {
    const verbose = options.verbose !== undefined && options.verbose === true;

    const headers = ["Network ID", "Network name"];
    if (verbose) {
      headers.push("Latest block number");
    }

    const networks = await tenderlyService.getNetworks();
    const filteredNetworks = networks.filter(isNotExcluded);
    filteredNetworks.sort((a, b) => a.sort_order - b.sort_order);

    logger.silly("Filtered networks:", filteredNetworks);

    const table = new Table({
      style: { head: ["magenta"] },
      head: headers,
    });

    table.push(
      ...(await Promise.all(
        filteredNetworks.map(async (network) => {
          if (verbose) {
            const blockNumber = await tenderlyService.getLatestBlockNumber(network.ethereum_network_id);
            return [network.ethereum_network_id, network.name, blockNumber];
          } else {
            return [network.ethereum_network_id, network.name];
          }
        })
      ))
    );
    logger.silly("Networks table:", table);

    console.log(table.toString());
  });

function isNotExcluded(element: TenderlyNetwork): boolean {
  return element.metadata.exclude_from_listing === undefined || element.metadata.exclude_from_listing === false;
}
