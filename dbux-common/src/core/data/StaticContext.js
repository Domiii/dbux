import Loc from "./Loc";

export default class StaticContext {
  type: number; // {StaticContextType}
  name: string;
  displayName: string;
  isInterruptable: boolean;
  staticId: number;
  parentId: number;
  programId: number;
  loc: Loc;
}