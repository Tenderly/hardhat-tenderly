import {
  deployTransparentUpgradeableProxy,
  deployUUPSProxy,
  deployBeaconProxy,
} from "./deployment";

export async function main() {
  // TransparentUpgradeableProxy
  await deployTransparentUpgradeableProxy();

  // UUPSProxy
  // await deployUUPSProxy();

  // Beacon Proxy
  // await deployBeaconProxy();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
