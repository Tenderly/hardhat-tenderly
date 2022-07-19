import Table from "cli-table";
import commander from "commander";
import { TenderlyPublicNetwork } from "../../../Tenderly/types/Network";
import { TenderlyService } from "../../../tenderly/TenderlyService";

export const NetworksCommand = new commander.Command("networks")
  .description("list all Tenderly supported networks")
  .action(async () => {
    const table = new Table({
      head: ["Network slug", "Network ID"]
    });

    const networks = await TenderlyService.getPublicNetworks();

    const filteredNetworks = networks.filter(isNotExcluded);

    filteredNetworks.sort((a, b) => a.sort_order - b.sort_order);

    filteredNetworks.forEach(function (network, index) {
      table.push([network.slug, network.ethereum_network_id]);
    });

    console.log(table.toString());
  });

function isNotExcluded(element: TenderlyPublicNetwork, index: number, array: TenderlyPublicNetwork[]): boolean {
  return element.metadata.exclude_from_listing === undefined || element.metadata.exclude_from_listing === false;
}
