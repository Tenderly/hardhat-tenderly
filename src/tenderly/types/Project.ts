import { Principal } from "./Principal";

export interface Project {
  id: string;
  slug: string;
  name: string;
  owner: Principal;
}
