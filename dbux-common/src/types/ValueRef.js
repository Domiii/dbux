import RefSnapshot from './RefSnapshot';

/** @typedef { any } RawValue */

export default class ValueRef extends RefSnapshot {
  /**
   * @type {number}
   */
  category;
  
  /**
   * @type {number}
   */
  pruneState;

  /**
   * @type {string}
   */
  typeName;

  /**
   * @type {boolean}
   */
  isThenable;

  /**
   * @type {boolean}
   */
  isError;

  /** ########################################
   * value serialization
   * #######################################*/

  /**
   * NOTE: when stored in DataProvider, `serialized` is deleted and replaced with `value` or `children`
   */
  serialized;

  /**
   * @type {boolean}
   */
  monkey;
}
