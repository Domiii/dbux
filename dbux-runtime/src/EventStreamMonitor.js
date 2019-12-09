export default class EventStreamMonitor {
  stacks = {};

  getStack(executionContext) {
    const contextId = executionContext.getId();
    return this.stacks[executionContext];
  }

  getOrCreateStack(executionContext) {
    // TODO
  }

  push(executionContext) {
    const stack = this.getOrCreateStack(executionContext);
    return stack.push(executionContext);
  }

  pop(executionContext) {
    const stack = this.getOrCreateStack(executionContext);
    return stack.pop(executionContext);
  }
}