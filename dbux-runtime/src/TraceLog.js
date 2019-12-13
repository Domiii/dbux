export const LogEventType = new Enum({
  RunStart: 1,
  Push: 2,
  Pop: 3,
  Schedule: 4
});

export default class TraceLog {
  /**
   * @returns {TraceLog}
   */
  static instance() {
    return this._instance || (this._instance = new TraceLog());
  }

  static logInternalError(...args) {
    console.error('[DBUX INTERNAL ERROR]', ...args);
  }

  _messages = [];

  _log(message) {
    this._messages.push(message);
    console.log(`[DBUX]`, message);
  }

  logRunStart(contextId) {
    this._log({
      type: LogEventType.RunStart,
      contextId
    });
  }

  logPush(contextId) {
    this._log({
      type: LogEventType.Push,
      contextId
    });
  }

  logPop(contextId) {
    this._log({
      type: LogEventType.Pop,
      contextId
    });
  }

  logSchedule(contextId, schedulerId) {
    this._log({
      type: LogEventType.Schedule,
      schedulerId,
      contextId
    });
  }

  logInternalError(...args) {
    return TraceLog.logInternalError(...args);
  }

}