export default class ExecutionEvent {
  static allocate() {
    // TODO: use object pool instead
    const obj = new ExecutionEvent();
    return obj;
  }
}