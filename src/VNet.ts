import axios from "axios";

const VNetHostURL = "http://127.0.0.1:1337";

export class VNet {
  public static async getForkID(): Promise<string | undefined> {
    try {
      const res = await axios.get(`${VNetHostURL}/vnet-id`);
      return res.data.vnetId;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }
}
