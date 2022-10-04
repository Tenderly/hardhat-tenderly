import axios from "axios";
import prompts from "prompts";

import { TenderlyApiService, TenderlyService } from "../../core/services";
import { logApiError } from "../../core/common/logger";
import { ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG } from "../../core/common/errors";
import { VIRTUAL_NETWORK_LOCAL_HOST } from "../jsonrpc/constants";
import { VNET_CREATION_FAILED_ERR_MSG } from "../common/errors";
import { VirtualNetwork } from "../types";

export class VirtualNetworkService {
  private pluginName: string;
  private tenderlyService: TenderlyService;

  constructor(pluginName: string) {
    this.pluginName = pluginName;
    this.tenderlyService = new TenderlyService(this.pluginName);
  }

  public async createVNet(
    accountSlug: string,
    projectSlug: string,
    networkId: string,
    blockNumber: string,
    chainConfig?: Record<string, string>
  ): Promise<VirtualNetwork | null> {
    if (!TenderlyApiService.isAuthenticated()) {
      console.log(`Error in ${this.pluginName}: ${ACCESS_TOKEN_NOT_PROVIDED_ERR_MSG}`);
      return null;
    }

    const tenderlyApi = TenderlyApiService.configureInstance();
    try {
      const res = await tenderlyApi.post(`/api/v1/account/${accountSlug}/project/${projectSlug}/fork`, {
        network_id: networkId,
        block_number: blockNumber === "latest" ? null : Number(blockNumber),
        chain_config: chainConfig,
        vnet: true,
      });

      return {
        id: res.data.simulation_fork.id,
        root_tx_id: res.data.root_transaction.id,
        chain_config: res.data.simulation_fork.chain_config,
      };
    } catch (err) {
      logApiError(err);
      console.log(`Error in ${this.pluginName}: ${VNET_CREATION_FAILED_ERR_MSG}`);
    }
    return null;
  }

  public async getLocalVNet(): Promise<VirtualNetwork | null> {
    try {
      const res = await axios.get(`${VIRTUAL_NETWORK_LOCAL_HOST}/vnet`);
      return res.data.vnet;
    } catch (_) {
      return null;
    }
  }

  public async promptProject(): Promise<[string, string]> {
    const principal = await this.tenderlyService.getPrincipal();
    if (principal === null) {
      process.exit(1);
    }
    const projects = await this.tenderlyService.getProjectSlugs(principal.id);
    projects.sort((a, b) => a.name.localeCompare(b.name));

    const projectChoices = projects.map((project) => {
      return {
        title: project.name,
        value: { slug: project.slug, username: project.owner.username },
      };
    });

    const response = await prompts({
      type: "autocomplete",
      name: "project",
      message: "Tenderly project",
      initial: projects[0].slug,
      choices: projectChoices,
    });

    return [response.project.slug, response.project.username];
  }

  public async promptNetwork(): Promise<string> {
    const networks = await this.tenderlyService.getNetworks();
    const filteredNetworks = networks.filter((element) => {
      return element.metadata.exclude_from_listing === undefined || element.metadata.exclude_from_listing === false;
    });
    filteredNetworks.sort((a, b) => a.sort_order - b.sort_order);
    const networkChoices = filteredNetworks.map((network) => {
      return {
        title: network.name,
        value: network.ethereum_network_id,
      };
    });

    const response = await prompts({
      type: "autocomplete",
      name: "network",
      message: "Network",
      initial: "Mainnet",
      choices: networkChoices,
    });

    return response.network;
  }

  public async promptBlockNumber(): Promise<string> {
    const question: prompts.PromptObject = {
      type: "text",
      name: "blockNumber",
      message: "Block number",
      initial: "latest",
      validate: this._validator,
    };
    const response = await prompts(question);

    return response.blockNumber;
  }

  private _validator(value: any): boolean | string {
    if ((value as string) === "latest") {
      return true;
    }

    if (!Number.isNaN(Number(value))) {
      return true;
    }

    return "Invalid block number: must be a number or latest\n";
  }
}
