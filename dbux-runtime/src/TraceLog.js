export const LogEventType = new Enum({
  Push: 1,
  Pop: 2
});

export default class TraceLog {
  _log = [];

  constructor(startId) {
    this.startId = startId;
  }

  logPush(context) {
    this._log.push({
      type: LogEventType.Push,
      ...context
    });
  }

}