export default class AsyncEvent {
  /**
   * @type {number}
   */
  asyncEventId;
  /**
   * @type {number | number[]}
   */
  fromRootContextId;
  /**
   * Use `dp.util.getChainFrom(rootId)` to get all chains from a root.
   * 
   * @type {number}
   */
  toRootContextId;
  /**
   * @type {number}
   */
  edgeType;

  // /**
  //  * @type {number | number[]}
  //  */
  // syncPromiseIds;

  promiseId;
}