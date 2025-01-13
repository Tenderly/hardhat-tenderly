import {
  ApiContract,
  BytecodeMismatchError,
  ContractResponse,
  VerificationResult,
  VerifyContractsResponse,
  CompilationError,
} from "../internal/core/types";
import { TenderlyConfig } from "../types";

export function convertToLogCompliantApiError(err: any) {
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
    return `Unexpected error occurred. \n  Error reason ${code} ${codeText}. \n  Error context: ${message}`;
  }

  // general error
  if (err instanceof Error) {
    return err.message;
  }
}

export function convertToLogCompliantForkVerificationResponse(
  res: ContractResponse,
) {
  const logCompliantContracts = convertToLogCompliantContracts(res.contracts);
  const logCompliantBytecodeMismatchErrors =
    convertToLogCompliantBytecodeMismatchErrors(res.bytecode_mismatch_errors);

  return {
    contracts: logCompliantContracts,
    bytecode_mismatch_errors: logCompliantBytecodeMismatchErrors,
  };
}

export function convertToLogCompliantContracts(contracts: ApiContract[]) {
  if (contracts === undefined || contracts === null) {
    return undefined;
  }

  const logCompliantContracts = [];
  for (const contract of contracts) {
    logCompliantContracts.push({
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
    });
  }
  return logCompliantContracts;
}

export function convertToLogCompliantBytecodeMismatchErrors(
  bytecodeMismatchErrors: BytecodeMismatchError[],
) {
  if (bytecodeMismatchErrors === undefined || bytecodeMismatchErrors === null) {
    return undefined;
  }

  const logCompliantBytecodeMismatchErrors = [];
  for (const err of bytecodeMismatchErrors) {
    logCompliantBytecodeMismatchErrors.push({
      contract_id: err.contract_id,
      expected: err.expected,
      got: err.got,
      similarity: err.similarity,
      assumed_reason: err.assumed_reason,
    });
  }
  return logCompliantBytecodeMismatchErrors;
}

export function convertToLogCompliantVerificationResponse(
  res: VerifyContractsResponse,
) {
  const logCompliantCompilationErrors = convertToLogCompliantCompilationErrors(
    res?.compilation_errors,
  );
  const logCompliantVerificationResults =
    convertToLogCompliantVerificationResults(res?.results);

  return {
    results: logCompliantVerificationResults,
    compilation_errors: logCompliantCompilationErrors,
    display_link: res.display_link,
  };
}

function convertToLogCompliantVerificationResults(
  results: VerificationResult[],
) {
  if (results === undefined || results === null) {
    return undefined;
  }

  const logCompliantVerifiedContracts = [];
  const logCompliantBytecodeMismatchErrors = [];

  for (const res of results) {
    if (
      res.bytecode_mismatch_error !== undefined &&
      res.bytecode_mismatch_error !== null
    ) {
      logCompliantBytecodeMismatchErrors.push({
        contract_id: res.bytecode_mismatch_error.contract_id,
        expected: res.bytecode_mismatch_error.expected,
        got: res.bytecode_mismatch_error.got,
        similarity: res.bytecode_mismatch_error.similarity,
        assumed_reason: res.bytecode_mismatch_error.assumed_reason,
      });
    } else if (res.verified_contract) {
      logCompliantVerifiedContracts.push({
        id: res.verified_contract.id,
        contract_id: res.verified_contract.contract_id,
        balance: res.verified_contract.balance,
        network_id: res.verified_contract.network_id,
        public: res.verified_contract.public,
        export: res.verified_contract.export,
        verification_date: res.verified_contract.verification_date,
        address: res.verified_contract.address,
        contract_name: res.verified_contract.contract_name,
        ens_domain: res.verified_contract.ens_domain,
        type: res.verified_contract.type,
        evm_version: res.verified_contract.evm_version,
        compiler_version: res.verified_contract.compiler_version,
        optimizations_used: res.verified_contract.optimizations_used,
        optimization_runs: res.verified_contract.optimization_runs,
        libraries: res.verified_contract.libraries,
        data: res.verified_contract.data,
        creation_block: res.verified_contract.creation_block,
        creation_tx: res.verified_contract.creation_tx,
        creator_address: res.verified_contract.creator_address,
        created_at: res.verified_contract.created_at,
        number_of_watches: res.verified_contract.number_of_watches,
        language: res.verified_contract.language,
        in_project: res.verified_contract.in_project,
        number_of_files: res.verified_contract.number_of_files,
      });
    }
  }

  return {
    verified_contracts: logCompliantVerifiedContracts,
    bytecode_mismatch_errors: logCompliantBytecodeMismatchErrors,
  };
}

function convertToLogCompliantCompilationErrors(
  compilationErrors: CompilationError[],
) {
  if (compilationErrors === undefined || compilationErrors === null) {
    return undefined;
  }

  const logCompliantCompilationErrors = [];
  for (const err of compilationErrors) {
    logCompliantCompilationErrors.push({
      source_location: err.source_location,
      error_type: err.error_type,
      component: err.component,
      message: err.message,
      formatted_message: err.formatted_message,
    });
  }

  return logCompliantCompilationErrors;
}

export function convertToLogCompliantProjects(projects: any[]) {
  if (projects === undefined || projects === null) {
    return undefined;
  }

  const logCompliantProjects = [];
  for (const project of projects) {
    logCompliantProjects.push({
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
    });
  }
  return logCompliantProjects;
}

export function convertToLogCompliantNetworks(networks: any[]) {
  if (networks === undefined || networks === null) {
    return undefined;
  }

  const logCompliantNetworks = [];
  for (const network of networks) {
    logCompliantNetworks.push({
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
    });
  }
  return logCompliantNetworks;
}

export function convertToLogCompliantForkInitializeResponse(res: any) {
  return {
    fork_id: res.simulation_fork.id,
    root_transaction: res.root_transaction.id,
    project_id: res.simulation_fork.project_id,
  };
}

export function convertToLogCompliantTenderlyConfig(config: TenderlyConfig) {
  return {
    email:
      config.email !== undefined && config.email !== null && config.email !== ""
        ? "set in 'email' field"
        : "undefined or null or empty string",
    account_id: config.account_id,
    username:
      config.username !== undefined &&
      config.username !== null &&
      config.username !== ""
        ? "set in 'username' field"
        : "undefined or null or empty string",
    access_key:
      config.access_key !== undefined &&
      config.access_key !== null &&
      config.access_key !== ""
        ? "super secret access_key is set in 'access_key' field"
        : "undefined or null or empty string",
    access_key_id:
      config.access_key_id !== undefined &&
      config.access_key_id !== null &&
      config.access_key_id !== ""
        ? "super secret access_key_id is set in 'access_key' field"
        : "undefined or null or empty string",
  };
}
