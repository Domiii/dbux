export const LogEventType = new Enum({
  Push: 1,
  Pop: 2
});

export default class TraceLog {
  static logInternalError(...args) {
    console.error('[DBUX INTERNAL ERROR]', ...args);
  }

  _log = [];

  constructor() {
  }

  logPush(context) {
    this._log.push({
      type: LogEventType.Push,
      ...context
    });
  }

  logInternalError(...args) {
    return TraceLog.logInternalError(...args);
  }

}