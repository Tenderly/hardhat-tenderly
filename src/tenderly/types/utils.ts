export interface TenderlyConfig {
  access_key: string
}

export interface CacheData {
  sources: Record<string, SourceData>
}

export interface SourceData {
  content: string
}

export interface BytecodeMismatchError {
  contract_id: string;
  expected: string;
  got: string;
}
