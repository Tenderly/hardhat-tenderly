import { TenderlyService } from "@tenderly/api-client";
import { 
  VerifyContractABIRequest,
  VerifyContractABIResponse
} from "@tenderly/api-client";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { throwIfUsernameOrProjectNotSet } from "../errors";
import { getChainId } from "../utils/util";

export class VerificationService {
  private readonly tenderlyService: TenderlyService;
  
  constructor(
    tenderlyService: TenderlyService
  ) {
    this.tenderlyService = tenderlyService;
  }
  
  public async verifyContractABI(
     hre: HardhatRuntimeEnvironment,
     address: string,
     contractName: string,
  ): Promise<VerifyContractABIResponse> {
    await throwIfUsernameOrProjectNotSet(hre);
    
    const networkId = await getChainId(hre);
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
    
    return await this.tenderlyService.verifyContractABI(
      username,
      project,
      request,
    )
  }
}
