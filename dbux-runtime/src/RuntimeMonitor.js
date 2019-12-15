import ExecutionStack from './ExecutionStack';
import programStaticContextCollection from './data/collections/programStaticContextCollection';
import TraceLog from './log/TraceLog';
import ProgramMonitor from './ProgramMonitor';
import { logError } from './log/logger';
import executionContextCollection from './data/collections/executionContextCollection';

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

  /**
   * Set of all active/scheduled calls.
   */
  _activeStacks = new Map();

  /**
   * The currently executing stack.
   */
  _executingContextRoot = null;

  _programMonitors = new Map();

  
  // ###########################################################################
  // Bookkeeping
  // ###########################################################################

  // getContext(contextId) {
  //   return this._contexts;
  // }

  /**
   * @returns {ProgramMonitor}
   */
  addProgram(programData) {
    const programStaticContext = programStaticContextCollection.addProgram(programData);
    const programMonitor = new ProgramMonitor(programStaticContext);
    this._programMonitors.set(programStaticContext.getProgramId(), programMonitor);
    return programMonitor;
  }

  getCurrentStack() {
    return this._executingContextRoot;
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
    this._executingContextRoot = null;
    this._activeStacks.delete(stack.getId());
  }


  // ###########################################################################
  // public interface
  // ###########################################################################

  /**
   * 
   */
  pushImmediate(programId, staticContextId) {
    const executionContext = executionContextCollection.immediate(programId, staticContextId);
    const contextId = executionContext.getContextId();
    if (!this._executingContextRoot) {
      // no executing stack -> this invocation has been called from some system or blackboxed scheduler,
      //    indicating a new start, and thus a new ExecutionStack (at least for as much as we can see)
      this._executingContextRoot = executionContext;
      TraceLog.instance.logStackStart(contextId);
    }
    else {
      // invocation on current stack
      executionContext.setRoot(this._executingContextRoot.contextId);
    }

    // TODO: setStack will keep a reference that we need to clean up later
    this._executingContextRoot.push(contextId);
    TraceLog.instance.logPush(contextId);
  }


  popImmediate(contextId) {
    // TODO
    // const context = this._contexts.get(contextId);
    // if (!context) {
    //   logError('Tried to pop context that was not registered:', contextId);
    // }
    // else {
    //   const stack = context.getStack();

    //   // pop context
    //   this._contexts.delete(contextId);
    //   const res = stack.pop(context);

    //   // make sure stack is currentStack
    //   if (stack !== this._executingContextRoot) {
    //     logError('Tried to pop from stack that is not activeStack:\n    ', stack, 'is not activeStack:', this._executingContextRoot);
    //   }
    //   if (stack.isEmpty()) {
    //     // end of this stack
    //     this._notifyStackFinished(stack);
    //   }

    //   // log
    //   TraceLog.instance.logPop(stack, context);

    //   return res;
    // }
  }


  // /**
  //  * Push a new context for a scheduled callback for later execution.
  //  * Especially for: (1) await, (2) promise, (3) time event, (4) other callback scheduling
  //  */
  // scheduleCallback() {
  //   // this is not an immediate invocation, but scheduled for later
  //   if (!this._executingStack) {
  //     // there must be an active stack from where the scheduling happened
  //     logError('No activeStack when scheduling callback call from:', schedulerId);
  //   }
  //   TraceLog.instance.logSchedule(contextId, schedulerId);
  // }

  // pushCallbackLink(scheduledContextId) {
  //   const linkedContext = ;
  //   if (!linkedContext) {
  //     logError('pushCallbackLink\'s `scheduledContextId` does not exist:', scheduledContextId);
  //     return;
  //   }

  //   // TODO: linking contexts/stacks
  //   // const linkId = ;
  //   return linkId;
  // }

  // popSchedule() {

  // }
}