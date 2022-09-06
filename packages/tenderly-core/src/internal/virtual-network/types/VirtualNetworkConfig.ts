export type VirtualNetworkConfig = {
  project_slug: string;
  username: string;
  network: string;
  block_number: string;
  chain_config?: Record<string, string>;
};
