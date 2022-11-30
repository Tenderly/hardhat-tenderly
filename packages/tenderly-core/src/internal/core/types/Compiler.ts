export interface CompilerConfiguration {
  language?: string;
  version?: string;
  settings?: CompilerSettings;
}

interface CompilerSettings {
  stop_after?: string;
  remapping?: string[];
  optimizer?: Optimizer;
  evmVersion?: string;
  viaIr?: boolean;
  debug?: Debug;
  metadata?: Metadata;
  libraries?: Record<string, Libraries>;
}

interface Optimizer {
  enabled?: boolean;
  runs?: number;
  details?: OptimizerDetails;
}

interface OptimizerDetails {
  peephole: boolean;
  inliner: boolean;
  jumpdestRemover: boolean;
  orderLiterals: boolean;
  deduplicate: boolean;
  cse: boolean;
  constantOptimizer: boolean;
  yul: boolean;
  yulDetails: YulDetails;
}

interface YulDetails {
  stackAllocation: boolean;
  optimizerSteps: string;
}

interface Debug {
  revertString?: string;
  debugInfo?: string[];
}

interface Metadata {
  useLiterContent: boolean;
  bytecodeHash: string;
}

interface Libraries {
  addresses: Record<string, string>;
}

export interface SourceLocation {
  file: string;
  start: number;
  end: number;
}

export interface CompilationError {
  source_location: SourceLocation;
  error_type: string;
  component: string;
  message: string;
  formatted_message: string;
}
