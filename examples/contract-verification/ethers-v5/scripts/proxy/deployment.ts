import { ethers, upgrades } from "hardhat";
import {
  getImplementationAddress,
  getImplementationAddressFromBeacon,
} from "@openzeppelin/upgrades-core";

export {
  deployTransparentUpgradeableProxy,
  deployUUPSProxy,
  deployBeaconProxy,
};

async function deployTransparentUpgradeableProxy(): Promise<string> {
  console.log(
    "\n---------------\n🖖🏽[ethers] Deploying TransparentUpgradeableProxy with VotingLogic as implementation on Tenderly.",
  );

  const VotingLogic = await ethers.getContractFactory("VotingLogic");
  let proxyContract = await upgrades.deployProxy(VotingLogic);
  proxyContract = await proxyContract.deployed();

  const proxyAddress = proxyContract.address;

  console.log("VotingLogic proxy deployed to:", proxyAddress);
  console.log(
    "VotingLogic impl deployed to:",
    await getImplementationAddress(ethers.provider, proxyAddress),
  );

  return proxyAddress;
}

async function deployUUPSProxy(): Promise<string> {
  console.log(
    "\n---------------\n🖖🏽[ethers] Deploying UUPSProxy with VotingLogic as implementation on Tenderly.",
  );

  const VotingLogicUpgradeable = await ethers.getContractFactory(
    "VotingLogicUpgradeable",
  );
  let proxyContract = await upgrades.deployProxy(VotingLogicUpgradeable, {
    kind: "uups",
  });
  proxyContract = await proxyContract.deployed();

  const proxyAddress = proxyContract.address;

  console.log("VotingLogicUpgradeable proxy deployed to:", proxyAddress);
  console.log(
    "VotingLogicUpgradeable impl deployed to:",
    await getImplementationAddress(ethers.provider, proxyAddress),
  );

  return proxyAddress;
}

async function deployBeaconProxy(): Promise<string> {
  console.log(
    "\n---------------\n🖖🏽[ethers] Deploying BeaconProxy with VotingLogic as implementation on Tenderly.",
  );
  const VotingLogic = await ethers.getContractFactory("VotingLogic");
  let votingLogicBeacon = await upgrades.deployBeacon(VotingLogic);
  votingLogicBeacon = await votingLogicBeacon.deployed();
  console.log(
    `Beacon with VotingLogic as implementation is deployed to address: ${votingLogicBeacon.address}`,
  );

  let beaconProxy = await upgrades.deployBeaconProxy(
    votingLogicBeacon.address,
    VotingLogic,
    [],
  );
  beaconProxy = await beaconProxy.deployed();

  console.log("BeaconProxy deployed to:", beaconProxy.address);
  console.log(
    "VotingLogic deployed to:",
    await getImplementationAddressFromBeacon(
      ethers.provider,
      votingLogicBeacon.address,
    ),
  );

  return beaconProxy.address;
}
