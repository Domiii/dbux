import Loc from "./Loc";

export default class StaticTrace {
  staticTraceId: number;
  staticContextId: number;
  type: number;
  loc: Loc;
  
  displayName: string;
}