import HasValue from './HasValue';

export default class AsyncEvent extends HasValue {
  /**
   * @type {number}
   */
  asyncEventId;
  /**
   * @type {number}
   */
  fromRun;
  /**
   * @type {number}
   */
  toRun;
  /**
   * @type {number}
   */
  edgeType;
}