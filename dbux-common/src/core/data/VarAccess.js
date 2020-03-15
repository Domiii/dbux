import HasValue from './HasValue';

export default class VarAccess extends HasValue {
  /**
   * @type {number}
   */
  varAccessId;

  /**
   * @type {number}
   */
  staticVarAccessId;

  /**
   * @type {number}
   */
  ownerId;
}