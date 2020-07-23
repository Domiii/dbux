import VarOwnerType from '../constants/VarOwnerType';

/** @typedef {import('../Loc').default} Loc */

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

  /**
   * @type {Loc}
   */
  loc;

  /**
   * @type {string}
   */
  name;
}