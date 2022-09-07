import { Libraries } from "@nomiclabs/hardhat-ethers/types";

export interface ContractByName {
  name: string;
  address: string;
  network?: string;
  libraries?: Libraries;
}
