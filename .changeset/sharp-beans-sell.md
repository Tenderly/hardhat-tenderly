---
"tenderly": minor
"@tenderly/hardhat-tenderly": minor
---

Enable multiple tenderly networks in hardhat.config.ts

From now on, you can put multiple networks in your `hardhat.config.ts` file in the `networks` property without the need name the network `tenderly` or `devnet`.

Just put:
```ts
networks: {
  my_tenderly_network_1: {
    url: "https://rpc.tenderly.co/fork/<forkId>",
  },
  my_tenderly_network_2: {
    url: "https://rpc.tenderly.co/fork/<forkId>",
  },
}
```
After that you can do:
```bash
npx hardhat run scripts/deploy.ts --network my_tenderly_network_1
```
