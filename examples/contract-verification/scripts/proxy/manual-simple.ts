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
  // Verify the proxy, implementation and all the related contracts with just the address.
  await tenderly.verify({
    // The name is not important, beneath is `@nomicfoundation/hardhat-verify` which doesn't need the name.
    name: ProxyPlaceholderName,
    address: tupAddress,
  });

  // UUPSProxy
  const uupsAddress = await deployUUPSProxy();
  // Verify the proxy, implementation and all the related contracts with just the address.
  await tenderly.verify({
    // The name is not important, beneath is `@nomicfoundation/hardhat-verify` which doesn't need the name.
    name: ProxyPlaceholderName,
    address: uupsAddress,
  });

  // Beacon Proxy
  const beaconProxyAddress = await deployBeaconProxy();
  // Verify the proxy, implementation and all the related contracts with just the address.
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
