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
   * NOTE: when stored in DataProvider, `serialized` is deleted
   */
  serialized;
}