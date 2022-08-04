const express = require("express");
const got = require("got");

const app = express();
app.use(express.json());

app.use(async (req, res) => {
  console.log(req.body.method);

  let tdlyRes = null 
  tdlyRes = await got
    .post("https://rpc.tenderly.co/fork/e2467cfc-1a6a-4e01-b365-3a0406c9e0e2", {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    })
    .json();

  // if (tdlyRes?.result?.hash) {
  //   console.log(
  //     "https://dashboard.tenderly.co/Riphal/project1/fork/d8f54c6e-800f-47cd-843c-07815f92e690/simulation/" +
  //       tdlyRes.result
  //   );
  //   console.log(tdlyRes);
  // }

  res.send(tdlyRes);
});

app.listen(1337);
