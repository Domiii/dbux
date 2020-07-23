export default class ValueRef {
  /**
   * @type {number}
   */
  valueId;
  
  /**
   * @type {number}
   */
  trackId;

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

  // when stored in DataProvider, serialized is taken out
  // serialized,

  value;
}