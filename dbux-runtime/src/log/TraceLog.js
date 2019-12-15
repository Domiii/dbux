let _instance;

export default class TraceLog {
  /**
   * @returns {TraceLog}
   */
  static get instance() {
    return _instance || (_instance = new TraceLog());
  }


  _messages = [];

  logProgramStart(contextId) {
    this._log({
      type: ExecutionEventType.ProgramStart,
      contextId
    });
  }

  logStackStart(contextId) {
    this._log({
      type: ExecutionEventType.StackStart,
      contextId
    });
  }

  logStackEnd(contextId) {
    this._log({
      type: ExecutionEventType.StackEnd,
      contextId
    });
  }

  logPush(contextId) {
    this._log({
      type: ExecutionEventType.Push,
      contextId
    });
  }

  logPop(contextId) {
    this._log({
      type: ExecutionEventType.Pop,
      contextId
    });
  }

  logSchedule(contextId, schedulerId) {
    this._log({
      type: ExecutionEventType.Schedule,
      schedulerId,
      contextId
    });
  }

}