export default class ValueRef {
  /**
   * @type {number}
   */
  refId;
  
  /**
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