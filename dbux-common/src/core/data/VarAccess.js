import Loc from "./Loc";
import VarOwnerType from '../constants/VarOwnerType';

export default class VarAccess {
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
  staticOwnerId;

  /**
   * @type {VarOwnerType}
   */
  ownerType;

  loc: Loc;
  name: string;
}