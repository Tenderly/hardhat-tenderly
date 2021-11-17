import * as fs from "fs-extra";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {sep} from "path";

import {DefaultChainId, NetworkMap, PluginName} from "./index";
import {TenderlyService} from "./tenderly/TenderlyService";
import {
  ContractByName,
  Metadata,
  TenderlyArtifact,
  TenderlyContract,
  TenderlyContractConfig,
  TenderlyContractUploadRequest
} from "./tenderly/types";
import { TenderlyNetwork } from "./TenderlyNetwork";
import {
  compareConfigs,
  extractCompilerVersion,
  getCompilerDataFromContracts,
  getContracts,
  newCompilerConfig,
  resolveDependencies
} from "./util";

export class Tenderly {
  public env: HardhatRuntimeEnvironment;
  public tenderlyNetwork: TenderlyNetwork;

  constructor(hre: HardhatRuntimeEnvironment) {
    this.env = hre;
    this.tenderlyNetwork = new TenderlyNetwork(hre);
  }

    public async verify(...contracts) {
        const flatContracts: ContractByName[] = contracts.reduce(
            (accumulator, value) => accumulator.concat(value),
            []
        );

        const requestData = await this.filterContracts(flatContracts);

        if (requestData == null) {
            console.log("Verification failed");
            return;
        }

        try {
            await TenderlyService.verifyContracts(requestData);
        } catch (err) {
            console.log(err.message);
        }
    }

  public network(): TenderlyNetwork {
    return this.tenderlyNetwork;
  }

  public setNetwork(network: TenderlyNetwork): TenderlyNetwork {
    this.tenderlyNetwork = network
    return this.tenderlyNetwork
  }

  public async push(...contracts) {
    const flatContracts: ContractByName[] = contracts.reduce(
      (accumulator, value) => accumulator.concat(value),
      []
    );

        const requestData = await this.filterContracts(flatContracts);

        if (this.env.config.tenderly.project === undefined) {
            console.log(
                `Error in ${PluginName}: Please provide the project field in the tenderly object in hardhat.config.js`
            );
            return;
        }

        if (this.env.config.tenderly.username === undefined) {
            console.log(
                `Error in ${PluginName}: Please provide the username field in the tenderly object in hardhat.config.js`
            );
            return;
        }

        if (requestData == null) {
            console.log("Push failed");
            return;
        }

        try {
            await TenderlyService.pushContracts(
                requestData,
                this.env.config.tenderly.project,
                this.env.config.tenderly.username
            );
        } catch (err) {
            console.log(err.message);
        }
    }

    public async persistArtifacts(...contracts) {
        if (contracts.length == 0) {
            return
        }

        const sourcePaths = await this.env.run("compile:solidity:get-source-paths");
        const sourceNames = await this.env.run(
            "compile:solidity:get-source-names",
            {sourcePaths}
        );
        const data = await this.env.run("compile:solidity:get-dependency-graph", {
            sourceNames
        });

        let contract: ContractByName;

        data._resolvedFiles.forEach((resolvedFile, _) => {
            const sourcePath: string = resolvedFile.sourceName;
            const name = sourcePath
                .split("/")
                .slice(-1)[0]
                .split(".")[0];

            for (contract of contracts) {
                if (contract.name === name) {
                    const network =
                        this.env.hardhatArguments.network !== "hardhat"
                            ? this.env.hardhatArguments.network || contract.network
                            : contract.network;
                    if (network === undefined) {
                        console.log(
                            `Error in ${PluginName}: Please provide a network via the hardhat --network argument or directly in the contract`
                        );
                        continue
                    }
                    let chainID: string = NetworkMap[network!.toLowerCase()];
                    if (this.env.config.networks[network!].chainId !== undefined) {
                        chainID = this.env.config.networks[network!].chainId!.toString();
                    }

                    if (chainID == undefined) {
                        chainID = DefaultChainId
                    }
                    const destPath = `deployments${sep}${network!.toLowerCase()}_${chainID}${sep}`;
                    const contractDataPath = `${this.env.config.paths.artifacts}${sep}${sourcePath}${sep}${name}.json`;
                    const contractData = JSON.parse(
                        fs.readFileSync(contractDataPath).toString()
                    );

          const metadata: Metadata = {
            compiler: {
              version: extractCompilerVersion(this.env.config, sourcePath)
            },
            sources: {
              [sourcePath]: {
                content: resolvedFile.content.rawContent
              }
            }
          };

                    const visited: Record<string, boolean> = {};

                    resolveDependencies(data, sourcePath, metadata, visited);

                    const artifact: TenderlyArtifact = {
                        metadata: JSON.stringify(metadata),
                        address: contract.address,
                        bytecode: contractData.bytecode,
                        deployedBytecode: contractData.deployedBytecode,
                        abi: contractData.abi
                    };

                    fs.outputFileSync(
                        `${destPath}${name}.json`,
                        JSON.stringify(artifact)
                    );
                }
            }
        });
    }

  private async filterContracts(
    flatContracts: ContractByName[]
  ): Promise<TenderlyContractUploadRequest | null> {
    let contract: ContractByName;
    let requestData: TenderlyContractUploadRequest;
    try {
      requestData = await this.getContractData(flatContracts);
    } catch (e) {
      return null;
    }

        for (contract of flatContracts) {
            const network =
                this.env.hardhatArguments.network !== "hardhat"
                    ? this.env.hardhatArguments.network || contract.network
                    : contract.network;
            if (network === undefined) {
                console.log(
                    `Error in ${PluginName}: Please provide a network via the hardhat --network argument or directly in the contract`
                );
                return null;
            }

            const index = requestData.contracts.findIndex(
                requestContract => requestContract.contractName === contract.name
            );
            if (index === -1) {
                continue;
            }
            let chainID: string = NetworkMap[network!.toLowerCase()];
            if (this.env.config.networks[network!].chainId !== undefined) {
                chainID = this.env.config.networks[network!].chainId!.toString();
            }

            if (chainID === undefined) {
                console.log(
                    `Error in ${PluginName}: Couldn't identify network. Please provide a chainID in the network config object`
                );
                return null;
            }
            requestData.contracts[index].networks = {
                [chainID]: {
                    address: contract.address
                }
            };
        }

        return requestData;
    }

  private async getContractData(
    flatContracts: ContractByName[]
  ): Promise<TenderlyContractUploadRequest> {
    const contracts = await getContracts(this.env, flatContracts);

    const config = getCompilerDataFromContracts(
      contracts,
      flatContracts,
      this.env.config
    );

    if (config === undefined) {
      console.log(`Error in ${PluginName}: No compiler configuration found`);
    }

    return {
      contracts,
      config: config!
    };
  }
}
