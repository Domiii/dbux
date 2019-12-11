import ExecutionStack from './ExecutionStack';
import StaticTraceMonitor from './StaticTraceMonitor';
import ExecutionContext from './ExecutionContext';
import TraceLog from './TraceLog';

/**
 * 
 */
export default class RuntimeTraceMonitor {
  _contexts = new Map();

  /**
   * The static trace monitors keep track of events related to the static code scaffold.
   */
  _staticTraceMonitors = new Map();

  /**
   * Set of all active/scheduled calls.
   */
  _activeStacks = new Map();

  /**
   * The currently executing stack.
   */
  _currentStack = null;

  // ###########################################################################
  // Bookkeeping
  // ###########################################################################

  // getContext(contextId) {
  //   return this._contexts;
  // }

  getCurrentStack() {
    return this._currentStack;
  }

  getOrCreateStackForInvocation(contextId, schedulerId) {
    const currentStack = this.getCurrentStack();
    let stack;
    if (schedulerId) {
      // this is not an immediate invocation, but scheduled for later; create new child stack for it
      if (!currentStack) {
        // there must be an active stack from where the scheduling happened
        TraceLog.logInternalError('No activeStack when scheduling callback call from:', schedulerId);
      }
      stack = this.createStack(contextId, currentStack);
    }
    else if (!currentStack) {
      // no active stack -> this invocation has been called from some system or blackboxed scheduler
      stack = this.createStack(contextId, null);
    }
    else {
      // new invocation on current stack
      stack = currentStack;
    }
    return stack;
  }

  genContextId(staticContextId, callerId) {
    const staticTrace = this.getOrCreateStaticTraceMonitor(staticContextId);
    return staticTrace.genContextId(callerId);
  }

  createStack(contextId, parent) {
    const stack = new ExecutionStack(contextId, parent);
    this._activeStacks.set(contextId, stack);
    return stack;
  }

  getOrCreateStaticTraceMonitor(staticContextId) {
    let traceMonitor = this._staticTraceMonitors.get(staticContextId);
    if (!traceMonitor) {
      this._staticTraceMonitors.set(staticContextId, traceMonitor = new StaticTraceMonitor(staticContextId));
    }
    return traceMonitor;
  }

  _notifyStackFinished(stack) {
    this._currentStack = null;
    this._activeStacks.delete(stack.getId());
  }

  // ###########################################################################
  // public interface
  // ###########################################################################

  /**
   * @param {*} staticContextId 
   * @param {*} schedulerId Set when `pushSchedule` is used instead of `push`
   */
  push(staticContextId, schedulerId = null) {
    const contextId = this.genContextId(staticContextId, schedulerId);
    const stack = this.getOrCreateStackForInvocation(contextId, schedulerId);
    const context = new ExecutionContext(staticContextId, schedulerId, contextId, stack);
    this._contexts.set(contextId, context);
    stack.push(context);
    stack._log.logPush(stack, context);
    return contextId;
  }

  /**
   * Push a new context for a scheduled callback for later execution.
   * Especially for: (1) await, (2) promise, (3) time event, (4) other callback scheduling
   */
  pushSchedule(staticContextId, schedulerId) {
    return this.push(staticContextId, schedulerId);
  }

  pop(contextId) {
    const context = this._contexts.get(contextId);
    if (!context) {
      TraceLog.logInternalError('Tried to pop context that was not registered:', contextId);
    }
    else {
      const stack = context.getStack();

      // pop context
      this._contexts.delete(contextId);
      const res = stack.pop(context);

      // make sure stack is currentStack
      if (stack !== this._currentStack) {
        TraceLog.logInternalError('Tried to pop from stack that is not activeStack:\n    ', stack, 'is not activeStack:', this._currentStack);
      }
      if (!stack.getActiveCount()) {
        // end of this stack
        this._notifyStackFinished(stack);
      }

      // log
      stack._log.logPop(stack, context);

      return res;
    }
  }

  popSchedule() {
    
  }
}