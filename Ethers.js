import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem"; 

 
const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    ethereum_mainnet: {
      url: `https://mainnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1
    },
    ethereum_sepolia: {
      url: `https://sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 11155111
    },
    hoodi: {
      url: `https://hoodi.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 560048
    },
    arbitrum: {
      url: `https://arbitrum.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 42161
    },
    arbitrum_nova: {
      url: `https://arbitrum-nova.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 42170
    },
    arbitrum_sepolia: {
      url: `https://arbitrum-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 421614
    },
    avalanche: {
      url: `https://avalanche.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 43114
    },
    avalanche_fuji: {
      url: `https://avalanche-fuji.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 43113
    },
    linea: {
      url: `https://linea.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 59144
    },
    linea_sepolia: {
      url: `https://linea-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 59141
    },
    base_mainnet: {
      url: `https://base.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 8453
    },
    base_sepolia: {
      url: `https://base-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 84532
    },
    optimism_mainnet: {
      url: `https://optimism.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 10
    },
    optimism_sepolia: {
      url: `https://optimism-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 11155420
    },
    polygon_mainnet: {
      url: `https://polygon.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 137
    },
    polygon_amoy: {
      url: `https://polygon-amoy.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 80002
    },
    apechain: {
      url: `https://apechain.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 33139
    },
    curtis: {
      url: `https://curtis.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 33111
    },
    blast: {
      url: `https://blast.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 81457
    },
    boba_ethereum_mainnet: {
      url: `https://boba-ethereum.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 288
    },
    boba_sepolia: {
      url: `https://boba-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 28882
    },
    berachain: {
      url: `https://berachain.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 80094
    },
    bepolia: {
      url: `https://bepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 80069
    },
    flare: {
      url: `https://flare.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 14
    },
    fraxtal: {
      url: `https://fraxtal.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 252
    },
    fraxtal_hoodi: {
      url: `https://fraxtal-hoodi.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 2523
    },
    bob: {
      url: `https://bob.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 60808
    },
    bob_testnet: {
      url: `https://bob-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 808813
    },
    immutable: {
      url: `https://immutable.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 13371
    },
    immutable_testnet: {
      url: `https://immutable-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 13473
    },
    ink: {
      url: `https://ink.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 57073
    },
    ink_sepolia: {
      url: `https://ink-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 763373
    },
    interval_testnet: {
      url: `https://interval-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 11069
    },
    lisk: {
      url: `https://lisk.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1135
    },
    lens: {
      url: `https://lens.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 232
    },
    lens_sepolia: {
      url: `https://lens-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 37111
    },
    lisk_sepolia: {
      url: `https://lisk-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 4202
    },
    gnosis_chain: {
      url: `https://gnosis-chain.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 100
    },
    gnosis_chiado_testnet: {
      url: `https://gnosis-chiado-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 10200
    },
    mantle: {
      url: `https://mantle.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 5000
    },
    mantle_sepolia: {
      url: `https://mantle-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 5003
    },
    metis_andromeda: {
      url: `https://metis-andromeda.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1088
    },
    metis_sepolia: {
      url: `https://metis-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 59902
    },
    moonbeam: {
      url: `https://moonbeam.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1284
    },
    moonbase_alpha: {
      url: `https://moonbase-alpha.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1287
    },
    moonriver: {
      url: `https://moonriver.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1285
    },
    soneium: {
      url: `https://soneium.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1868
    },
    soneium_minato: {
      url: `https://soneium-minato.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1946
    },
    sonic: {
      url: `https://sonic.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 146
    },
    sonic_blaze: {
      url: `https://sonic-blaze.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 57054
    },
    swellchain: {
      url: `https://swellchain.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1923
    },
    swellchain_sepolia: {
      url: `https://swellchain-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1924
    },
    taiko: {
      url: `https://taiko-mainnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 167000
    },
    taiko_hoodi: {
      url: `https://taiko-hoodi.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 167013
    },
    unichain: {
      url: `https://unichain.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 130
    },
    unichain_sepolia: {
      url: `https://unichain-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1301
    },
    worldchain_mainnet: {
      url: `https://worldchain-mainnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 480
    },
    worldchain_sepolia: {
      url: `https://worldchain-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 4801
    },
    scroll_mainnet: {
      url: `https://scroll-mainnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 534352
    },
    scroll_sepolia: {
      url: `https://scroll-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 534351
    },
    ronin: {
      url: `https://ronin.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 2020
    },
    ronin_testnet: {
      url: `https://ronin-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 202601
    },
    sophon: {
      url: `https://sophon.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 50104
    },
    story: {
      url: `https://story.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1514
    },
    story_aeneid: {
      url: `https://story-aeneid.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1315
    },
    zksync: {
      url: `https://zksync.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 324
    },
    zksync_sepolia: {
      url: `https://zksync-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 300
    },
    katana: {
      url: `https://katana.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 747474
    },
    katana_bokuto: {
      url: `https://katana-bokuto.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 737373
    },
    af_nexus_mainnet: {
      url: `https://af-nexus-mainnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 9069
    },
    af_nexus_testnet: {
      url: `https://af-nexus-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 9070
    },
    zircuit: {
      url: `https://zircuit.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 48900
    },
    zircuit_garfield_testnet: {
      url: `https://zircuit-garfield-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 48898
    },
    celo: {
      url: `https://celo.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 42220
    },
    celo_sepolia: {
      url: `https://celo-sepolia.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 11142220
    },
    plasma_testnet: {
      url: `https://plasma-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 9746
    },
    plasma: {
      url: `https://plasma.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 9745
    },
    cfx_espace: {
      url: `https://cfx-espace.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1030
    },
    cfx_espace_testnet: {
      url: `https://cfx-espace-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 71
    },
    stable_testnet: {
      url: `https://stable-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 2201
    },
    stable: {
      url: `https://stable.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 988
    },
    monad_testnet: {
      url: `https://monad-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 10143
    },
    monad: {
      url: `https://monad.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 143
    },
    tempo_moderato_testnet: {
      url: `https://tempo-moderato-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 42431
    },
    xlayer: {
      url: `https://xlayer.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 196
    },
    xlayer_testnet: {
      url: `https://xlayer-testnet.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 1952
    },
    megaeth: {
      url: `https://megaeth.gateway.tenderly.co/${process.env.TENDERLY_NODE_ACCESS_KEY}`,
      chainId: 4326
    }
  }

 
};

 
export default config;

