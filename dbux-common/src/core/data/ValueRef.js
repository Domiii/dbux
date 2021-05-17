export default class ValueRef {
  /**
   * @type {number}
   */
  valueId;
  
  /**
   * @type {number}
   */
  refId;

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