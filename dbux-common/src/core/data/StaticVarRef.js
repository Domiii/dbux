import Loc from "./Loc";

export default class StaticVarAccess {
  /**
   * @type {number}
   */
  programId;
  /**
   * @type {number}
   */
  staticVarId;
  /**
   * @type {number}
   */
  staticLoopId;

  loc: Loc;
  name: string;
}