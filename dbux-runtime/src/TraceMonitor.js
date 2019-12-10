import ExecutionStack from './ExecutionStack';
import StaticTraceMonitor from './StaticTraceMonitor';
import ExecutionContext from './ExecutionContext';

/**
 * 
 */
export default class TraceMonitor {
  stacks = {};
  staticTraceMonitors = {};

  // ###########################################################################
  // Bookkeeping
  // ###########################################################################

  getOrCreateStaticTraceMonitor(staticContextId) {
    return this.staticTraceMonitors[staticContextId] = (
      this.staticTraceMonitors[staticContextId] ||
      (this.staticTraceMonitors[staticContextId] = new StaticTraceMonitor(staticContextId))
    );
  }

  genContextId(staticContextId, callerId) {
    const staticTrace = this.getOrCreateStaticTraceMonitor(staticContextId);
    return staticTrace.genContextId(callerId);
  }

  createStack(contextId) {
    return new ExecutionStack(contextId);
  }

  getStack(contextId) {
    const stack = this.stacks[contextId];
    return stack;
  }

  getOrCreateStack(contextId) {
    const stack = this.stacks[contextId];
    if (!stack) {
      // 
    }
    return stack;
  }

  // ###########################################################################
  // Tracing
  // ###########################################################################

  /**
   * @param {*} staticContextId 
   * @param {*} callerId Set for (1) await, (2) promise, (3) time event, (4) other callback calls.
   */
  push(staticContextId, callerId) {
    const contextId = this.genContextId(staticContextId, callerId);
    const stack = this.getOrCreateStack(contextId);
    const context = new ExecutionContext(staticContextId, callerId, contextId);
    stack.push(context);
    return contextId;
  }

  pop(contextId) {
    const stack = this.getStack(contextId);
    if (!stack) {
      return null;
    }
    return stack.pop(contextId);
  }
}