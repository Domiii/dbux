import Loc from "./loc";

export default class StaticContext {
  type: number; // {StaticContextType}
  name: string;
  displayName: string;
  isInterruptable;
  staticId: number;
  programId: number;
  loc: Loc;
}