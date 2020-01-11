export default class ExecutionEvent {
  eventType;
  contextId;
  where;

  static allocate() {
    // TODO: use object pool instead
    const obj = new ExecutionEvent();
    return obj;
  }
}