import * as axios from "axios";

import { logger } from "../../../utils/logger";
import { getConfig, isAccessTokenSet } from "../../../utils/config";
import { TENDERLY_API_BASE_URL, TENDERLY_JSON_RPC_BASE_URL } from "../../../common/constants";

export class TenderlyApiService {
  public static configureInstance(providedAccessKey?: string): axios.AxiosInstance {
    logger.debug("Configuring instance.");

    let accessKey: string
    if (!!providedAccessKey) {
      accessKey = providedAccessKey
    } else {
      const tdlyConfig = getConfig();
      accessKey = tdlyConfig.access_key
    }
    const params = {
      baseURL: TENDERLY_API_BASE_URL,
      headers: { "x-access-key": accessKey },
    };

    logger.debug("Configured instance with parameters:", {
      baseURL: TENDERLY_API_BASE_URL,
      access_key:
      accessKey !== undefined && accessKey !== null && accessKey !== ""
          ? "super secret access_key is set in 'access_key' field"
          : "undefined or null or empty string",
    });

    return axios.default.create(params);
  }

  public static configureAnonymousInstance(): axios.AxiosInstance {
    logger.debug("Configured anonymous instance towards tenderly api.");

    return axios.default.create({
      baseURL: TENDERLY_API_BASE_URL,
    });
  }

  public static configureTenderlyRPCInstance(): axios.AxiosInstance {
    logger.debug("Configuring tenderly RPC instance.");

    const tdlyConfig = getConfig();
    const params = {
      baseURL: TENDERLY_JSON_RPC_BASE_URL,
      headers: {
        "x-access-key": tdlyConfig.access_key,
        Head: tdlyConfig.head !== undefined ? tdlyConfig.head : "",
      },
    };

    logger.debug("Configured tenderly rpc instance with parameters:", {
      baseURL: TENDERLY_JSON_RPC_BASE_URL,
      access_key:
        tdlyConfig.access_key !== undefined && tdlyConfig.access_key !== null && tdlyConfig.access_key !== ""
          ? "super secret access_key is set in 'access_key' field"
          : "undefined or null or empty string",
    });

    return axios.default.create(params);
  }

  public static isAuthenticated(): boolean {
    return isAccessTokenSet();
  }
}
