import * as axios from "axios";

import { logger } from "../../../utils/logger";
import { getConfig, isAccessTokenSet } from "../../../utils/config";
import { TENDERLY_API_BASE_URL, TENDERLY_JSON_RPC_BASE_URL } from "../../../common/constants";

export class TenderlyApiService {
  public static configureInstance(): axios.AxiosInstance {
    logger.debug("Configuring instance...");

    const tdlyConfig = getConfig();
    const params = {
      baseURL: TENDERLY_API_BASE_URL,
      accessKey: tdlyConfig.access_key,
    };
    logger.debug("Configured instance with parameters:", params);

    return axios.default.create(params);
  }

  public static configureAnonymousInstance(): axios.AxiosInstance {
    logger.debug("Configured anonymous instance with base url:", TENDERLY_API_BASE_URL);

    return axios.default.create({
      baseURL: TENDERLY_API_BASE_URL,
    });
  }

  public static configureTenderlyRPCInstance(): axios.AxiosInstance {
    logger.debug("Configuring tenderly RPC instance...");

    const tdlyConfig = getConfig();
    const params = {
      baseURL: TENDERLY_JSON_RPC_BASE_URL,
      headers: {
        "x-access-key": tdlyConfig.access_key,
        Head: tdlyConfig.head !== undefined ? tdlyConfig.head : "",
      },
    };
    logger.debug("Configured tenderly rpc instance with parameters:", params);

    return axios.default.create(params);
  }

  public static isAuthenticated(): boolean {
    logger.debug("Getting if user is authenticated...");
    const isAuth = isAccessTokenSet();
    logger.debug("isAuthenticated returned:", isAuth);

    return isAuth;
  }
}
