import { TenderlyService, VERIFICATION_TYPES } from "@tenderly/api-client";
import { 
  VerifyContractABIRequest,
  VerifyContractABIResponse
} from "@tenderly/api-client";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { throwIfUsernameOrProjectNotSet } from "../errors";
import { getChainId } from "../utils/util";
import { TenderlyNetwork } from "../TenderlyNetwork";
import { getVerificationType, isVerificationOnVnet } from "../utils";
import { VerifyContractABIOnDevnetNotSupportedError } from "./errors";

export class VerificationService {
  private readonly tenderlyService: TenderlyService;
  private readonly tenderlyNetwork: TenderlyNetwork;
  
  constructor(
    tenderlyService: TenderlyService,
    tenderlyNetwork: TenderlyNetwork,
  ) {
    this.tenderlyService = tenderlyService;
    this.tenderlyNetwork = tenderlyNetwork;
  }
  
  public async verifyContractABI(
     hre: HardhatRuntimeEnvironment,
     address: string,
     contractName: string,
  ): Promise<VerifyContractABIResponse> {
    await throwIfUsernameOrProjectNotSet(hre);
    
    const authRequest = await this.makeVerifyContractABIRequest(
      hre,
      address,
      contractName,
    );
    
    // if the verificationType is on project,
    // add the contract to the project, first so ABI verification doesn't break because of that.
    if (authRequest.verificationType === VERIFICATION_TYPES.PRIVATE || VERIFICATION_TYPES.PUBLIC) {
      await this.tenderlyService.addContractToProject(
        authRequest.username,
        authRequest.project,
        {
          network_id: authRequest.request.networkId,
          address: authRequest.request.address,
          display_name: authRequest.request.contractName,
        }
      )
    }
    
    return this.tenderlyService.verifyContractABI(
      authRequest.username,
      authRequest.project,
      authRequest.verificationType,
      authRequest.request,
    )
  }
  
  private async makeVerifyContractABIRequest(
    hre: HardhatRuntimeEnvironment,
    address: string,
    contractName: string,
  ): Promise<AuthenticatedVerifyContractABIRequest> {
    const verificationType = await getVerificationType(hre, this.tenderlyNetwork);
    if (verificationType === VERIFICATION_TYPES.DEVNET) {
      throw new VerifyContractABIOnDevnetNotSupportedError()
    }

    let networkId = (await getChainId(hre)).toString();
    if (await isVerificationOnVnet(verificationType)) {
      networkId = this.tenderlyNetwork.forkID!;
    }

    const abi = (await hre.artifacts.readArtifact(contractName)).abi;
    const abiString = JSON.stringify(abi);

    const request: VerifyContractABIRequest = {
      networkId: networkId.toString(),
      address: address,
      contractName: contractName,
      abi: abiString,
    }

    const username = hre.config.tenderly.username;
    const project = hre.config.tenderly.project;
    
    return {
      username,
      project,
      verificationType,
      request,
    }
  }
}

interface AuthenticatedVerifyContractABIRequest {
  username: string;
  project: string;
  verificationType: string;
  request: VerifyContractABIRequest;
}
