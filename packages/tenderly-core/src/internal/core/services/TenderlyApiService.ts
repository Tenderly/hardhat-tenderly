import * as axios from "axios";

import { getConfig, isAccessTokenSet } from "../../../utils/config";
import { TENDERLY_API_BASE_URL, TENDERLY_JSON_RPC_BASE_URL } from "../../../common/constants";

export class TenderlyApiService {
  public static configureInstance(): axios.AxiosInstance {
    const tdlyConfig = getConfig();
    return axios.default.create({
      baseURL: TENDERLY_API_BASE_URL,
      headers: { "x-access-key": tdlyConfig.access_key },
    });
  }

  public static configureAnonymousInstance(): axios.AxiosInstance {
    return axios.default.create({
      baseURL: TENDERLY_API_BASE_URL,
    });
  }

  public static configureTenderlyRPCInstance(): axios.AxiosInstance {
    const tdlyConfig = getConfig();
    return axios.default.create({
      baseURL: TENDERLY_JSON_RPC_BASE_URL,
      headers: {
        "x-access-key": tdlyConfig.access_key,
        Head: tdlyConfig.head !== undefined ? tdlyConfig.head : "",
      },
    });
  }

  public static isAuthenticated(): boolean {
    return isAccessTokenSet();
  }
}
