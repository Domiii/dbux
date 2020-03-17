import Loc from "./Loc";
import VarOwnerType from '../constants/VarOwnerType';

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
   * @type {boolean}
   */
  isWrite;

  /**
   * @type {VarOwnerType}
   */
  ownerType;

  /**
   * @type {number}
   */
  staticOwnerId;

  loc: Loc;
  name: string;
}