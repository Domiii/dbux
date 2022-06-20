import RefSnapshot from './RefSnapshot';
import ValueTypeCategory from './constants/ValueTypeCategory';

/** @typedef { any } RawValue */

export default class ValueRef extends RefSnapshot {
  /**
   * {@link ValueTypeCategory}
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
