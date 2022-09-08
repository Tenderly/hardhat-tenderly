import axios from "axios";

import { logError } from "../../core/common/logger";
import { VIRTUAL_NETWORK_LOCAL_HOST } from "../jsonrpc/constants";
import { VNET_FETCH_FAILED_ERR_MSG } from "../common/errors";
import { VirtualNetwork } from "../types";

export class VirtualNetworkService {
  private pluginName: string;

  constructor(pluginName: string) {
    this.pluginName = pluginName;
  }

  public async get(): Promise<VirtualNetwork | null> {
    try {
      const res = await axios.get(`${VIRTUAL_NETWORK_LOCAL_HOST}/vnet`);
      return res.data.vnet;
    } catch (err) {
      logError(err);
      console.log(`Error in ${this.pluginName}: ${VNET_FETCH_FAILED_ERR_MSG}`);
      return null;
    }
  }
}
