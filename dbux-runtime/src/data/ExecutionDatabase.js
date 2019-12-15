import ExecutionEventType from './ExecutionEventType';

class ExecutionEvent {
  static allocate() {
    const evt = new ExecutionEvent();
    evt._init();
    return evt;
  }

  _init() {

  }
}

/**
 * During execution, we gather a lot of valuable data.
 * All of that is maintained and made available for use here.
 */
export default class ExecutionDatabase {
  /**
   * @private
   */
  static _instance;

  static get instance() {
    return this._instance || (this._instance = new ExecutionDatabase());
  }

}