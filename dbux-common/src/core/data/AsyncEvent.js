import HasValue from './HasValue';

export default class AsyncEvent extends HasValue {
  /**
   * @type {number}
   */
  asyncEventId;
  /**
   * @type {number}
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