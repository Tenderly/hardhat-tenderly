export interface TenderlyForkTransaction {
  id: string;
  project_id: string;
  fork_id: string;
  state_objects: StateObject[];
}

export interface StateObject {
  address: string;
  data: Record<string, string>;
}
