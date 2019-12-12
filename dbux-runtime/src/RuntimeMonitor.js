import ExecutionStack from './ExecutionStack';
import StaticContextManager from './StaticContextManager';
import ExecutionContext from './ExecutionContext';
import TraceLog from './TraceLog';
import ProgramMonitor from './ProgramMonitor';

/**
 * 
 */
export default class RuntimeMonitor {
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


  createStack(contextId, parent) {
    const stack = new ExecutionStack(contextId, parent);
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
   * @param {*} staticContextId 
   * @param {*} schedulerId Set when `pushSchedule` is used instead of `push`
   */
  push(staticContextId, schedulerId = null) {
    // TODO: don't need a stack for scheduled contexts
    const contextId = this._staticContextManager.genContextId(staticContextId, schedulerId);
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

  pushCallbackLink(scheduledContextId) {
    const linkedContext = this._contexts.get(scheduledContextId);
    if (!linkedContext) {
      TraceLog.logInternalError('pushCallbackLink\'s `scheduledContextId` does not exist:', scheduledContextId);
      return;
    }

    // TODO: linking contexts/stacks
    const linkId = ;
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