import Table from "cli-table3";
import commander from "commander";
import { value TenderlyPublicNetwork } from "../../../../../tenderly-hardhat/src/tenderly/types/Network";
import { value TenderlyService } from "../../../../../tenderly-hardhat/src/tenderly/TenderlyService";

export const NetworksCommand = new commander.Command("networks")
  .description("list all Tenderly supported networks")
  .option("-v, --verbose", "display detailed network information")
  .action(async options => {
    const verbose = options.verbose != undefined && options.verbose == true;

    const headers = ["Network ID", "Network name"];
    if (verbose) {
      headers.push("Latest block number");
    }

    const table = new Table({
      style: { head: ["magenta"] },
      head: headers
    });

    const networks = await TenderlyService.getPublicNetworks();

    const filteredNetworks = networks.filter(isNotExcluded);

    filteredNetworks.sort((a, b) => a.sort_order - b.sort_order);

    table.push(
      ...(await Promise.all(
        filteredNetworks.map(async network => {
          if (verbose) {
            const blockNumber = await TenderlyService.getLatestBlockNumber(network.ethereum_network_id);

            return [network.ethereum_network_id, network.name, blockNumber];
          } else {
            return [network.ethereum_network_id, network.name];
          }
        })
      ))
    );

    console.log(table.toString());
  });

function isNotExcluded(element: TenderlyPublicNetwork): boolean {
  return element.metadata.exclude_from_listing === undefined || element.metadata.exclude_from_listing === false;
}
