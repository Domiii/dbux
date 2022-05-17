import RefSnapshot from './RefSnapshot';

/** @typedef { any } RawValue */

export default class ValueRef {
  /**
   * @type {number}
   */
  refId;
  
  /**
   * Id of `DataNode` that captured the first instance of this value.
   * @type {number}
   */
  nodeId;

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
   * NOTE: when stored in DataProvider, `serialized` is deleted and replaced with `value` or `childSnapshots`
   */
  serialized;

  /**
   * If this is not a ref type.
   * NOTE: usually, non-ref values are stored in `DataNode.value`.
   * At this point, should only be set in case something went wrong when recording the value, and adds extra information to what happened.
   * 
   * @type {RawValue?}
   */
  value;

  /**
   * If this is a ref type:
   * "Initial state" snapshots of this ref's children at time of first recording.
   * 
   * @type {Object<string, RefSnapshot>?}
   */
  childSnapshotsByKey;
}