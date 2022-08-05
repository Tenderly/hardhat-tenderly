import express from "express";
import got from "got";
import supportsHyperlinks from "supports-hyperlinks";
import hyperlinker from "hyperlinker";

const app = express();
app.use(express.json());

app.use(async (req, res) => {
  console.log(req.body.method);

  const response: any = await got.post(
    "https://rpc.tenderly.co/fork/e2467cfc-1a6a-4e01-b365-3a0406c9e0e2",
    {
      headers: {
        "Content-Type": "application/json",
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
          "https://dashboard.tenderly.co/igorpetkovic/project/fork/e2467cfc-1a6a-4e01-b365-3a0406c9e0e2/simulation/" +
            response.headers["head"]
        )
      );
    } else {
      console.log(
        "https://dashboard.tenderly.co/igorpetkovic/project/fork/e2467cfc-1a6a-4e01-b365-3a0406c9e0e2/simulation/" +
          response.headers["head"]
      );
    }
  }

  res.send(tdlyRes);
});

app.listen(1337, () => {
  console.log(
    "Forwarding: http://localhost:1337 --> https://rpc.tenderly.co/vnet/{{fork_id}}"
  );
});
