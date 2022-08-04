import express from "express";
import got from "got";

const app = express();
app.use(express.json());

app.use(async (req, res) => {
  console.log(req.body.method);

  const tdlyRes: any = await got
    .post("https://rpc.tenderly.co/fork/ed6f31c5-9d52-46b3-9181-54b8970e12cc", {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    })
    .json();

  // if (tdlyRes?.result?.hash) {
  //   console.log(
  //     "https://dashboard.tenderly.co/Riphal/project1/fork/ed6f31c5-9d52-46b3-9181-54b8970e12cc/simulation/" +
  //       tdlyRes.result
  //   );
  //   console.log(tdlyRes);
  // }

  res.send(tdlyRes);
});

app.listen(1337, () => {
  console.log(
    "Forwarding: http://localhost:1337 --> https://rpc.tenderly.co/vnet/{{fork_id}}"
  );
});
