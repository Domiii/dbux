import HasValue from './HasValue';

export default class RootContext extends HasValue {
  /**
   * @type {number}
   */
  rootContextId;
  /**
   * @type {number}
   */
  threadId;
}