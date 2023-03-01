import { Libraries } from "@nomiclabs/hardhat-ethers/types";

export interface ContractByName {
  name: string;
  address: string;
  network?: string;
  libraries?: Libraries;
}

export interface ContractByAddress {
  address: string;
  display_name?: string;
  network_id: string;
}
