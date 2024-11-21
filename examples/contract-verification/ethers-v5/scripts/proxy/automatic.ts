import {
  deployTransparentUpgradeableProxy,
  deployUUPSProxy,
  deployBeaconProxy,
} from "./deployment";

export async function main() {
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
