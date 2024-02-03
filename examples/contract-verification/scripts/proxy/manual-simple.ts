import { tenderly } from "hardhat";
import { ProxyPlaceholderName } from "@tenderly/hardhat-tenderly";
import {
  deployTransparentUpgradeableProxy,
  deployUUPSProxy,
  deployBeaconProxy,
} from "./deployment";

export async function main() {
  // TransparentUpgradeableProxy
  const tupAddress = await deployTransparentUpgradeableProxy();
  await tenderly.verify({
    // The name is not important, beneath is `@nomicfoundation/hardhat-verify` which doesn't need the name.
    name: ProxyPlaceholderName,
    address: tupAddress,
  });

  // UUPSProxy
  const uupsAddress = await deployUUPSProxy();
  await tenderly.verify({
    // The name is not important, beneath is `@nomicfoundation/hardhat-verify` which doesn't need the name.
    name: ProxyPlaceholderName,
    address: uupsAddress,
  });

  // Beacon Proxy
  const beaconProxyAddress = await deployBeaconProxy();
  await tenderly.verify({
    // The name is not important, beneath is `@nomicfoundation/hardhat-verify` which doesn't need the name.
    name: ProxyPlaceholderName,
    address: beaconProxyAddress,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
