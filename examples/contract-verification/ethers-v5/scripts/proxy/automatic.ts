import {
  deployTransparentUpgradeableProxy,
  deployUUPSProxy,
  deployBeaconProxy,
} from "./deployment";

export async function main() {
  await sleep(5000);
  // TransparentUpgradeableProxy
  // The plugin will automatically verify the proxy, implementation and all the related contracts on deployment.
  await deployTransparentUpgradeableProxy();

  // UUPSProxy
  // The plugin will automatically verify the proxy, implementation and all the related contracts on deployment.
  await deployUUPSProxy();

  // Beacon Proxy
  // The plugin will automatically verify the proxy, implementation and all the related contracts on deployment.
  await deployBeaconProxy();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
