---
"@tenderly/hardhat-tenderly": minor
"@tenderly/hardhat-integration": minor
---

Support Virtual Environment RPC URLs in the region and environment-path forms
(`virtual.<network>.<region>.rpc.tenderly.co/<org>/<project>/<env-slug>`).

Previously the plugin only recognized the legacy
`virtual.<network>.rpc.tenderly.co/<endpoint-uuid>` form, so verification on
newly created Virtual Environments silently fell through to public/private
API verification. Environment-path URLs now verify through the
Etherscan-compatible verifier served on the RPC URL itself (the same flow the
Tenderly CLI and Foundry use), submitting the solc standard-JSON input from
the Hardhat build info; the RPC URL authenticates the request. The
`TENDERLY_AUTOMATIC_POPULATE_HARDHAT_VERIFY_CONFIG` flow composes
`<rpc>/verify` for environment-path URLs without the vnet-type lookup;
`<rpc>/verify` is the only supported verifier endpoint for Virtual
Environments and needs no access key.

Note: verification via `@nomicfoundation/hardhat-verify` (proxy contracts,
`verify:verify`) against environment-path URLs additionally requires
`getsourcecode` support on the RPC verifier, which is tracked server-side.
