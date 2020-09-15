export interface TenderlyKeyConfig {
  access_key: string
}

export interface BytecodeMismatchError {
  contract_id: string;
  expected: string;
  got: string;
}

export interface TenderlyConfig {
  project: string;
  username: string;
}
