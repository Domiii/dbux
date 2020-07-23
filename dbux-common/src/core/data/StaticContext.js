/** @typedef {import('../Loc').default} Loc */

export default class StaticContext {
  /**
   * @type {number}
   */
  staticContextType; // {StaticContextType}
  /**
   * @type {string}
   */
  name;
  /**
   * @type {string}
   */
  displayName;
  /**
   * @type {bool}
   */
  isInterruptable;
  /**
   * @type {number}
   */
  staticId;
  /**
   * @type {number}
   */
  parentId;
  /**
   * @type {number}
   */
  programId;
  /**
   * @type {Loc}
   */
  loc;
}