import HasValue from './HasValue';

export default class AsyncNode extends HasValue {
  /**
   * @type {number}
   */
  rootContextId;
  /**
   * @type {number}
   */
  threadId;
}