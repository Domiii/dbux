

export default class ExecutionContextManager {
  /**
   * @type {ExecutionContextManager}
   */
  static instance() {
    return this._instance || (this._instance = new ExecutionContextManager());
  }

  getTextId() {
    return `${this._staticContextId}${schedulerId ? `_${schedulerId}` : ''}_${orderId}`;
  }
}