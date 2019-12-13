import ExecutionStack from './ExecutionStack';
import StaticContextManager from './StaticContextManager';
import ExecutionContext from './ExecutionContext';
import TraceLog from './TraceLog';
import ProgramMonitor from './ProgramMonitor';

/**
 * 
 */
export default class RuntimeMonitor {
  static _instance;
  /**
   * Singleton
   * @type {RuntimeMonitor}
   */
  static get instance() {
    return this._instance || (this._instance = new RuntimeMonitor());
  }

  _contexts = new Map();

  /**
   * Set of all active/scheduled calls.
   */
  _activeStacks = new Map();

  /**
   * The currently executing stack.
   */
  _currentStack = null;

  _programs = new Map();

  // ###########################################################################
  // Bookkeeping
  // ###########################################################################

  // getContext(contextId) {
  //   return this._contexts;
  // }

  addProgram(programData) {
    this.programs.push(programData);

    const { staticSites } = programData;
    // const offsetIdx = this.staticContexts.length;
    // this.staticContexts.push(...staticSites.map((site, i) => new StaticContext(i + offsetIdx, programData, site)));
    const programStaticContext = StaticContextManager.instance.addProgram(programData);
    const programMonitor = new ProgramMonitor(programStaticContext);
    this._programs.set(programStaticContext.getProgramId(), programMonitor);
    return programMonitor;
  }

  getCurrentStack() {
    return this._currentStack;
  }

  /**
   * @return {ExecutionStack}
   */
  getOrCreateStackForContext(contextId, schedulerId) {
    const currentStack = this.getCurrentStack();
    let stack;
    if (!currentStack) {
      // no active stack -> this invocation has been called from some system or blackboxed scheduler
      //    indicating a new start, and thus a new ExecutionStack (at least for as much as we can see)
      stack = this.createStack(contextId, null, null);
      TraceLog.instance().logRunStart(contextId, schedulerId);
    }
    else {
      // new invocation on current stack
      stack = currentStack;
    }
    return stack;
  }

  /**
   * 
   */
  createStack(contextId, schedulerId, parent) {
    // TODO: use Object pool for stack objects to avoid memory churn in performance-critical applications
    const stack = new ExecutionStack(contextId, schedulerId, parent);
    this._activeStacks.set(contextId, stack);
    return stack;
  }

  _notifyStackFinished(stack) {
    this._currentStack = null;
    this._activeStacks.delete(stack.getId());
  }

  // ###########################################################################
  // public interface
  // ###########################################################################

  /**
   * @param {ExecutionContext} context
   */
  push(contextId, schedulerId) {
    const stack = this.getOrCreateStackForContext(contextId, schedulerId);
    // this._contexts.set(contextId, context);
    if (!schedulerId) {
      stack.push(contextId);
    }
    TraceLog.instance().logPush(contextId);
    return contextId;
  }

  /**
   * Push a new context for a scheduled callback for later execution.
   * Especially for: (1) await, (2) promise, (3) time event, (4) other callback scheduling
   */
  scheduleCallback(staticContextId, schedulerId) {
    // this is not an immediate invocation, but scheduled for later
    if (!this._currentStack) {
      // there must be an active stack from where the scheduling happened
      TraceLog.logInternalError('No activeStack when scheduling callback call from:', schedulerId);
    }
    TraceLog.instance().logSchedule(contextId, schedulerId);
  }

  pushCallbackLink(scheduledContextId) {
    const linkedContext = this._contexts.get(scheduledContextId);
    if (!linkedContext) {
      TraceLog.logInternalError('pushCallbackLink\'s `scheduledContextId` does not exist:', scheduledContextId);
      return;
    }

    // TODO: linking contexts/stacks
    // const linkId = ;
    return linkId;
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