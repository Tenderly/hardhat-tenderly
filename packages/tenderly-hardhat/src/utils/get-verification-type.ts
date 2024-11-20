import { isTenderlyNetworkConfig } from "./util";
import { VERIFICATION_TYPES } from "../constants";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TenderlyNetwork } from "../TenderlyNetwork";

export async function getVerificationType(
  hre: HardhatRuntimeEnvironment,
  tenderlyNetwork: TenderlyNetwork
): Promise<string> {
  if (isTenderlyNetworkConfig(hre.network.config)) {
    return tenderlyNetwork.devnetID !== undefined
      ? VERIFICATION_TYPES.DEVNET
      : VERIFICATION_TYPES.FORK;
  }

  const priv = hre.config.tenderly?.privateVerification;
  if (
    priv !== undefined &&
    priv &&
    !isTenderlyNetworkConfig(hre.network.config)
  ) {
    return VERIFICATION_TYPES.PRIVATE;
  }

  return VERIFICATION_TYPES.PUBLIC;
}

export async function isVerificationOnVnet(verificationType: string): Promise<boolean> {
  return (
    verificationType === VERIFICATION_TYPES.DEVNET ||
    verificationType === VERIFICATION_TYPES.FORK
  );
}

