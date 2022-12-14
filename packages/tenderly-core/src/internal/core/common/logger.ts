import { ContractResponse, TenderlyConfig } from "../../../types";

const API_ERR_MSG = "Unexpected error occurred. \n  Error reason %s %s. \n  Error context: %s";
import { logger } from "../../../utils/logger";

export function logApiError(err: any) {
  // api error
  if ("response" in err) {
    const code = err?.response?.status;
    const codeText = err?.response?.statusText;
    let message = "No message";
    if (err.response?.data?.error?.message) {
      message = err.response.data.error.message;
    } else if (err.response?.data) {
      message = err.response.data;
    }

    logger.error(API_ERR_MSG, code, codeText, message);
    return;
  }

  // general error
  if (err instanceof Error) {
    logger.error(err.message);
  }
}

export function logConfig(config: TenderlyConfig) {
  logger.trace("Checking config:", {
    email:
      config.email !== undefined && config.email !== null && config.email !== ""
        ? "set in 'email' field"
        : "undefined or null or empty string",
    account_id: config.account_id,
    username:
      config.username !== undefined && config.username !== null && config.username !== ""
        ? "set in 'username' field"
        : "undefined or null or empty string",
    access_key:
      config.access_key !== undefined && config.access_key !== null && config.access_key !== ""
        ? "super secret access_key is set in 'access_key' field"
        : "undefined or null or empty string",
    access_key_id:
      config.access_key_id !== undefined && config.access_key_id !== null && config.access_key_id !== ""
        ? "super secret access_key_id is set in 'access_key' field"
        : "undefined or null or empty string",
  });
}

export function logGetProjectsResponse(projects: any[]) {
  if (projects) {
    for (const project of projects) {
      const projectLog = {
        project_id: project.id,
        project_name: project.name,
        project_slug: project.slug,
        high_volume: project.high_volume,
        in_transfer: project.in_transfer,
        is_module: project.is_module,
        created_at: project.created_at,
        last_push_at: project.last_push_at,
        number_of_users: project.number_of_users,
        options: project.options,
        owner_principal_id: project.owner_id,
        owner_principal_type: project.owner.type,
        owner_permissions_for_project: project.permissions,
      };
      logger.trace("Obtained project:", projectLog);
    }
  }
}

export function logGetPublicNetworksResponse(networks: any[]) {
  if (networks) {
    for (const network of networks) {
      const networkLog = {
        id: network.id,
        name: network.name,
        ethereum_network_id: network.ethereum_network_id,
        slug: network.slug,
        metadata: {
          color: network.metadata.color,
          explorer_base_url: network.metadata.explorer_base_url,
          icon: network.metadata.icon,
          label: network.metadata.label,
          native_currency: network.metadata.native_currency,
          secondary_slugs: network.metadata.secondary_slugs,
          short_identifier: network.metadata.short_identifier,
          slug: network.metadata.slug,
        },
        chain_config: network.chain_config,
        sort_order: network.sort_order,
      };
      logger.silly("Obtained public network:", networkLog);
    }
  }
}

export function logVerificationResponse(response: ContractResponse) {
  if (response.contracts) {
    for (const contract of response.contracts) {
      const contractLog = {
        id: contract.id,
        contract_id: contract.contract_id,
        balance: contract.balance,
        network_id: contract.network_id,
        public: contract.public,
        export: contract.export,
        verification_date: contract.verification_date,
        address: contract.address,
        contract_name: contract.contract_name,
        ens_domain: contract.ens_domain,
        type: contract.type,
        evm_version: contract.evm_version,
        compiler_version: contract.compiler_version,
        optimizations_used: contract.optimizations_used,
        optimization_runs: contract.optimization_runs,
        libraries: contract.libraries,
        data: contract.data,
        creation_block: contract.creation_block,
        creation_tx: contract.creation_tx,
        creator_address: contract.creator_address,
        created_at: contract.created_at,
        number_of_watches: contract.number_of_watches,
        language: contract.language,
        in_project: contract.in_project,
        number_of_files: contract.number_of_files,
      };

      logger.trace("Verified contract:", contractLog);
    }
  } 

  if (response.bytecode_mismatch_errors) {
    for (const err of response?.bytecode_mismatch_errors) {
      const errLog = {
        contract_id: err.contract_id,
        expected: err.expected,
        got: err.got,
        similarity: err.similarity,
        assumed_reason: err.assumed_reason,
      };
      logger.trace("Bytecode mismatch error:", errLog);
    }
  }
}

export function logInitializeForkResponse(data: any) {
  logger.trace("Initialized fork:", {
    fork_id: data.simulation_fork.id,
    root_transaction: data.root_transaction.id,
    project_id: data.simulation_fork.project_id,
  });
}
