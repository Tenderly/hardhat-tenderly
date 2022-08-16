export interface VNet {
  vnetId: string;
  rootTxId: string;
}

export interface VNetTransaction {
  id: string;
  project_id: string;
  fork_id: string;
  state_objects: StateObject[];
}

export interface StateObject {
  address: string;
  data: Record<string, string>;
}
