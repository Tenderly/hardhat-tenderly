import express from "express";
import got from "got";
import hyperlinker from "hyperlinker";
import { TenderlyService } from "../../../tenderly/TenderlyService";
import { VNet } from "../../../tenderly/types/VNet";
import { getAccessToken } from "../../../utils/config";
import { updateChainConfig, getTemplate, VNetTemplate } from "../../../utils/template";

const app = express();
app.use(express.json());

let vnet: VNet;

const SUPPORTS_HYPERLINKS: boolean = process.env.SUPPORTS_HYPERLINKS == "true";
const TAB: string = "    ";

const filepath: string = process.argv[2];
const template: VNetTemplate = getTemplate(filepath);
const verbose: boolean = process.argv[3] == "true";
const saveChainConfig: boolean = process.argv[4] == "true";

app.get("/vnet-id", (_, res) => {
  res.json({ vnetId: vnet.vnet_id });
});

app.use(async (req, res) => {
  try {
    const response: any = await got.post(`https://rpc.tenderly.co/vnet/${vnet.vnet_id}`, {
      headers: {
        "Content-Type": "application/json",
        "X-ACCESS-KEY": getAccessToken()
      },
      body: JSON.stringify(req.body)
    });

    printRPCCall(req, response);

    res.send(JSON.parse(response.body));
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

app.listen(1337, async () => {
  vnet = await TenderlyService.createVNet(
    template.username,
    template.project_slug,
    template.network,
    template.block_number,
    template.chain_config
  );

  if (saveChainConfig) {
    updateChainConfig(filepath, vnet.chain_config);
  }

  console.log(`\nForwarding: http://127.0.0.1:1337 --> https://rpc.tenderly.co/vnet/${vnet.vnet_id}\n`);

  await listAccounts(vnet);
});

async function listAccounts(vnet: VNet) {
  const forkTx = await TenderlyService.getTransaction(
    template.username,
    template.project_slug,
    vnet.vnet_id,
    vnet.root_tx_id
  );

  const warningMessage =
    "WARNING: These accounts, and their private keys, are publicly known.\nAny funds sent to them on Mainnet or any other live network WILL BE LOST.\n";

  console.log("Accounts\n========\n");
  console.log(warningMessage);
  forkTx.state_objects.forEach(function(stateObject, index) {
    console.log(`Account #${index}: ${stateObject.address} (100 ETH)\n`);
  });
  console.log(warningMessage);
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
        `https://dashboard.tenderly.co/${template.username}/${template.project_slug}/fork/${vnet.vnet_id}/simulation/${simulationID}`
      );
      console.log(`${TAB}Hash:\t\t`, `${txHash}(${hyperlink})`, "\n");
      return;
    }

    console.log(`${TAB}Hash:\t\t`, txHash);
    console.log(
      `${TAB}View in Tenderly:\t`,
      `https://dashboard.tenderly.co/${template.username}/${template.project_slug}/fork/${vnet.vnet_id}/simulation/${simulationID}`
    );
  }
}
