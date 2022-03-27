/** @typedef {import('./Loc').default} Loc */

export default class StaticContext {
  /**
   * @type {StaticContextType}
   */
  type;
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
   * @type {bool}
   */
  isAsync;
  /**
   * @type {bool}
   */
  isGenerator;
  /**
   * @type {number}
   */
  staticContextId;

  /**
   * @type {number}
   * @deprecated Use `staticContextId` instead.
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