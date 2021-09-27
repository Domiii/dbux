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
   * @type {number}
   */
  toRootContextId;
  /**
   * @type {number}
   */
  edgeType;
}