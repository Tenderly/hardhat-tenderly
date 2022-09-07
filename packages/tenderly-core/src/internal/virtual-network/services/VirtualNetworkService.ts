import axios from "axios";

import { VIRTUAL_NETWORK_LOCAL_HOST } from "../jsonrpc/constants";

export class VirtualNetworkService {
  public static async getID(): Promise<string | undefined> {
    try {
      const res = await axios.get(`${VIRTUAL_NETWORK_LOCAL_HOST}/vnet-id`);
      return res.data.id;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }
}
