export interface TenderlyNetwork {
  ethereum_network_id: string;
  name: string;
  slug: string;
  metadata: TenderlyNetworkMetadata;
  sort_order: number;
}

export interface TenderlyNetworkMetadata {
  label: string;
  slug: string;
  secondary_slugs: string[];
  short_identifier: string;
  exclude_from_listing: boolean;
}
