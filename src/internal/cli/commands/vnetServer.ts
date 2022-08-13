import express from "express";
import got from "got";
import hyperlinker from "hyperlinker";
import { TenderlyService } from "../../../tenderly/TenderlyService";
import { VNet } from "../../../tenderly/types/VNet";
import { getAccessToken } from "../../../utils/config";
import { getTemplate, VNetTemplate } from "../../../utils/template";

const app = express();
app.use(express.json());

let vnet: VNet;

const SUPPORTS_HYPERLINKS: boolean = process.env.SUPPORTS_HYPERLINKS == "true";

const filepath: string = process.argv[2];
const template: VNetTemplate = getTemplate(filepath);
const verbose: boolean = process.argv[3] == "true";

app.get("/vnet-id", (_, res) => {
  res.json({ vnetId: vnet.vnetId });
});

app.use(async (req, res) => {
  try {
    //TODO change to vnet route
    const response: any = await got.post(
      `http://localhost:8500/vnet/${vnet.vnetId}`,
      // `https://rpc.tenderly.co/fork/${vnet.vnetId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-ACCESS-KEY": getAccessToken(),
        },
        body: JSON.stringify(req.body),
      }
    );

    const tdlyRes = JSON.parse(response.body);

    // Log all methodes
    const method = req.body.method;
    if (verbose && !isWriteMethod(method)) {
      console.log(method);
    }

    if (isWriteMethod(method)) {
      const forkTxID = response.headers["x-transaction-id"];

      console.log(method);
      if (SUPPORTS_HYPERLINKS) {
        console.log(
          hyperlinker(
            "View in Tenderly",
            `https://dashboard.tenderly.co/${template.username}/${template.projectSlug}/fork/${vnet.vnetId}/simulation/${forkTxID}`
          )
        );
      } else {
        console.log(
          `https://dashboard.tenderly.co/${template.username}/${template.projectSlug}/fork/${vnet.vnetId}/simulation/${forkTxID}`
        );
      }
    }

    res.send(tdlyRes);
  } catch (err) {
    console.error(err);
    res.send(err);
  }
});

app.listen(1337, async () => {
  vnet = await TenderlyService.createVNet(
    template.username,
    template.projectSlug,
    template.network,
    template.blockNumber
  );

  console.log(
    `Forwarding: http://localhost:1337 --> https://rpc.tenderly.co/vnet/${vnet.vnetId}\n`
  );

  await listAccounts(vnet);
});

async function listAccounts(vnet: VNet) {
  const forkTx = await TenderlyService.getTransaction(
    template.username,
    template.projectSlug,
    vnet.vnetId,
    vnet.rootTxId
  );

  console.log(
    "Accounts\n========\n\nWARNING: These accounts, and their private keys, are publicly known.\nAny funds sent to them on Mainnet or any other live network WILL BE LOST.\n"
  );

  forkTx.state_objects.forEach(function(stateObject, index) {
    console.log(
      "Account #" + index + ": " + stateObject.address + " (100 ETH)\n"
    );
  });

  console.log(
    "WARNING: These accounts, and their private keys, are publicly known.\nAny funds sent to them on Mainnet or any other live network WILL BE LOST.\n"
  );
}

function isWriteMethod(method: string): boolean {
  return ["eth_sendTransaction", "eth_sendRawTransaction"].includes(method);
}
