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

async function deployTransparentUpgradeableProxy() {
  console.log(
    "🖖🏽[ethers] Deploying TransparentUpgradeableProxy with VotingLogic as implementation on Tenderly."
  );

  const VotingLogic = await ethers.getContractFactory("VotingLogic");
  let votingLogic = await upgrades.deployProxy(VotingLogic);
  votingLogic = await votingLogic.waitForDeployment();

  const votingLogicAddress = await votingLogic.getAddress();

  console.log("VotingLogic proxy deployed to:", votingLogicAddress);
  console.log(
    "VotingLogic impl deployed to:",
    await getImplementationAddress(ethers.provider, votingLogicAddress)
  );
}

async function deployUUPSProxy() {
  console.log(
    "🖖🏽[ethers] Deploying UUPSProxy with VotingLogic as implementation on Tenderly."
  );

  const VotingLogicUpgradeable = await ethers.getContractFactory(
    "VotingLogicUpgradeable"
  );
  let votingLogicUpgradeable = await upgrades.deployProxy(
    VotingLogicUpgradeable,
    { kind: "uups" }
  );
  votingLogicUpgradeable = await votingLogicUpgradeable.waitForDeployment();

  const votingLogicUpgradeableAddress =
    await votingLogicUpgradeable.getAddress();

  console.log(
    "VotingLogicUpgradeable proxy deployed to:",
    votingLogicUpgradeableAddress
  );
  console.log(
    "VotingLogicUpgradeable impl deployed to:",
    await getImplementationAddress(
      ethers.provider,
      votingLogicUpgradeableAddress
    )
  );
}

async function deployBeaconProxy() {
  console.log(
    "🖖🏽[ethers] Deploying BeaconProxy with VotingLogic as implementation on Tenderly."
  );

  const VotingLogic = await ethers.getContractFactory("VotingLogic");
  let votingLogicBeacon = await upgrades.deployBeacon(VotingLogic);
  votingLogicBeacon = await votingLogicBeacon.waitForDeployment();
  console.log(
    `Beacon with VotingLogic as implementation is deployed to address: ${await votingLogicBeacon.getAddress()}`
  );
  let beaconProxy = await upgrades.deployBeaconProxy(
    await votingLogicBeacon.getAddress(),
    VotingLogic,
    []
  );
  beaconProxy = await beaconProxy.waitForDeployment();

  console.log("BeaconProxy deployed to:", await beaconProxy.getAddress());
  console.log(
    "VotingLogic deployed to:",
    await getImplementationAddressFromBeacon(
      ethers.provider,
      await votingLogicBeacon.getAddress()
    )
  );
}
