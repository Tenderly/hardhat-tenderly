import express from "express";
import got from "got";
import hyperlinker from "hyperlinker";
import supportsHyperlinks from "supports-hyperlinks";
import { TenderlyService } from "../../../tenderly/TenderlyService";
import { VNet } from "../../../tenderly/types/VNet";
import { getAccessToken } from "../../../utils/config";
import { getTemplate } from "../../../utils/template";

const app = express();
app.use(express.json());

const filepath = process.argv[2];
const template = getTemplate(filepath);
let vnet: VNet;

app.use(async (req, res) => {
  console.log(req.body.method);

  //TODO change to vnet route
  const response: any = await got.post(
    `https://rpc.tenderly.co/fork/${vnet.vnetId}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-ACCESS-KEY": getAccessToken(),
      },
      body: JSON.stringify(req.body),
    }
  );

  const tdlyRes = JSON.parse(response.body);

  if (tdlyRes?.result?.hash) {
    if (supportsHyperlinks.stdout) {
      console.log(
        hyperlinker(
          "View in Tenderly",
          `https://dashboard.tenderly.co/${template.username}/${template.projectSlug}/fork/${vnet.vnetId}/simulation/${response.headers["head"]}`
        )
      );
    } else {
      console.log(
        `https://dashboard.tenderly.co/${template.username}/${template.projectSlug}/fork/${vnet.vnetId}/simulation/${response.headers["head"]}`
      );
    }
  }

  res.send(tdlyRes);
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
  const forkTx = await TenderlyService.getVNetTransaction(
    template.username,
    template.projectSlug,
    vnet.vnetId,
    vnet.rootTxId
  );
  forkTx.state_objects.forEach(function(stateObject, index) {
    console.log(
      "Account #" + index + ": " + stateObject.address + " (100 ETH)\n"
    );
  });
}
