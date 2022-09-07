const hyperlinker = require("hyperlinker");
import express from "express";
import got from "got";

import { getAccessToken } from "../../../utils/config";
import { TENDERLY_JSON_RPC_BASE_URL, TENDERLY_DASHBOARD_BASE_URL, PLUGIN_NAME } from "../../../common/constants";

import { TenderlyService } from "../../core/services/TenderlyService";
import { VirtualNetwork, VirtualNetworkConfig } from "../types";
import { updateChainConfig, getConfig } from "../utils/config";
import { VIRTUAL_NETWORK_LOCAL_HOST, TAB, WARNING_MESSAGE } from "./constants";

const app = express();
app.use(express.json());

const tenderlyService = new TenderlyService(PLUGIN_NAME);

let vnet: VirtualNetwork;

const SUPPORTS_HYPERLINKS: boolean = process.env.SUPPORTS_HYPERLINKS == "true";

const filepath: string = process.argv[2];
const config: VirtualNetworkConfig = getConfig(filepath);
const verbose: boolean = process.argv[3] == "true";
const saveChainConfig: boolean = process.argv[4] == "true";

app.get("/vnet-id", (_, res) => {
  res.json({ vnetId: vnet.vnet_id });
});

app.use(async (req, res) => {
  try {
    const response: any = await got.post(`${TENDERLY_JSON_RPC_BASE_URL}/vnet/${vnet.vnet_id}`, {
      headers: {
        "Content-Type": "application/json",
        "X-ACCESS-KEY": getAccessToken(),
      },
      body: JSON.stringify(req.body),
    });

    printRPCCall(req, response);

    res.send(JSON.parse(response.body));
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

app.listen(1337, async () => {
  const vnetTmp = await tenderlyService.createVNet(
    config.username,
    config.project_slug,
    config.network,
    config.block_number,
    config.chain_config
  );
  if (!vnetTmp) {
    process.exit(1);
  }
  vnet = vnetTmp;

  if (saveChainConfig) {
    updateChainConfig(filepath, vnet.chain_config);
  }

  console.log(`Forwarding: ${VIRTUAL_NETWORK_LOCAL_HOST} --> ${TENDERLY_JSON_RPC_BASE_URL}/vnet/${vnet.vnet_id}\n`);

  await listAccounts(vnet);
});

async function listAccounts(vnet: VirtualNetwork) {
  const forkTx = await tenderlyService.getTransaction(
    config.username,
    config.project_slug,
    vnet.vnet_id,
    vnet.root_tx_id
  );
  if (!forkTx) {
    process.exit(1);
  }

  console.log(WARNING_MESSAGE);
  forkTx.state_objects.forEach((stateObject, index) => {
    console.log(`Account #${index}: ${stateObject.address} (100 ETH)`);
  });
  console.log(`\n${WARNING_MESSAGE}`);
}

function isWriteMethod(method: string): boolean {
  return ["eth_sendTransaction", "eth_sendRawTransaction"].includes(method);
}

function printRPCCall(req: any, rawRes: any): void {
  const method = req.body.method;

  if (verbose && !isWriteMethod(method)) {
    console.log(method);
  }

  if (isWriteMethod(method)) {
    const callArgs = req.body?.params[0];
    const simulationID = rawRes.headers["x-simulation-id"];
    const res = JSON.parse(rawRes.body);
    const txHash = res.result;

    console.log(method);

    // to is optional when creating new contract
    if (callArgs?.to) {
      console.log(`${TAB}Contract call:\t`, "TODO"); // TODO: get contract name form deployments file
    } else {
      console.log(`${TAB}Contract deployment:`, "TODO"); // TODO: get contract name form deployments file
    }

    console.log(`${TAB}From:\t\t`, callArgs?.from);

    if (callArgs?.to) {
      console.log(`${TAB}To:\t\t\t`, callArgs?.to);
    }

    if (callArgs?.value) {
      console.log(`${TAB}Value:\t\t`, callArgs?.value);
    }

    if (res.error) {
      console.log(`\n${TAB}Error:\t\t`, res.error.message, "\n");
      return;
    }

    if (SUPPORTS_HYPERLINKS) {
      const hyperlink = hyperlinker(
        "View in Tenderly",
        `${TENDERLY_DASHBOARD_BASE_URL}/${config.username}/${config.project_slug}/fork/${vnet.vnet_id}/simulation/${simulationID}`
      );
      console.log(`${TAB}Hash:\t\t`, `${txHash}(${hyperlink})`, "\n");
      return;
    }

    console.log(`${TAB}Hash:\t\t`, txHash);
    console.log(
      `${TAB}View in Tenderly:\t`,
      `${TENDERLY_DASHBOARD_BASE_URL}/${config.username}/${config.project_slug}/fork/${vnet.vnet_id}/simulation/${simulationID}`
    );
  }
}
