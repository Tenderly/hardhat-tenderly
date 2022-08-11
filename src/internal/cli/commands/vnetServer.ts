import express from "express";
import got from "got";
import supportsHyperlinks from "supports-hyperlinks";
import hyperlinker from "hyperlinker";
import { TenderlyService } from "../../../tenderly/TenderlyService";
import { getAccessToken } from "../../../utils/config";

const app = express();
app.use(express.json());

app.use(async (req, res) => {
  console.log(req.body.method);

  //TODO change to vnet route
  const response: any = await got.post(
    "https://rpc.tenderly.co/fork/e2467cfc-1a6a-4e01-b365-3a0406c9e0e2",
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
        //TODO pull params from config
        hyperlinker(
          "View in Tenderly",
          "https://dashboard.tenderly.co/igorpetkovic/project/fork/e2467cfc-1a6a-4e01-b365-3a0406c9e0e2/simulation/" +
            response.headers["head"]
        )
      );
    } else {
      //TODO pull params from config
      console.log(
        "https://dashboard.tenderly.co/igorpetkovic/project/fork/e2467cfc-1a6a-4e01-b365-3a0406c9e0e2/simulation/" +
          response.headers["head"]
      );
    }
  }

  res.send(tdlyRes);
});

app.listen(1337, async () => {
  //TODO pull params from config
  console.log(
    "Forwarding: http://localhost:1337 --> https://rpc.tenderly.co/vnet/{{fork_id}}\n"
  );

  //TODO pull params from config
  const forkTx = await TenderlyService.getForkTransaction(
    "igorpetkovic",
    "project",
    "e2467cfc-1a6a-4e01-b365-3a0406c9e0e2",
    "fd7d7af1-b43d-428d-bca3-bde5625daea6"
  );
  forkTx.state_objects.forEach(function(stateObject, index) {
    console.log(
      "Account #" + index + ": " + stateObject.address + " (100 ETH)\n"
    );
  });
});
