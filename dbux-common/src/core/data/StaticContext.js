import Loc from "./Loc";

export default class StaticContext {
  staticContextType: number; // {StaticContextType}
  name: string;
  displayName: string;
  isInterruptable: boolean;
  staticId: number;
  parentId: number;
  programId: number;
  loc: Loc;
}