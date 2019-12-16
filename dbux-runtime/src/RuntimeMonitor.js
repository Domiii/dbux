import ExecutionStack from './ExecutionStack';
import programStaticContextCollection from './data/collections/programStaticContextCollection';
import ProgramMonitor from './ProgramMonitor';
import { logError } from './log/logger';
import executionContextCollection from './data/collections/executionContextCollection';
import executionEventCollection from './data/collections/executionEventCollection';
import ExecutionEventType from './data/ExecutionEventType';

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
  _executingDepth = 0;

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
    const rootId = this._executingContextRoot?.contextId;

    // register context
    const context = executionContextCollection.addImmediate(programId, staticContextId, rootId);
    if (!this._executingContextRoot) {
      // no executing stack -> this invocation has been called from some system or blackboxed scheduler,
      //    indicating a new start, and thus a new ExecutionStack (at least for as much as we can see)
      this._executingContextRoot = context;
    }

    // misc updates
    ++this._executingDepth;

    // log event
    const { contextId } = context;
    executionEventCollection.logPushImmediate(contextId, this._executingDepth);
  }


  popImmediate(contextId) {
    // sanity checks
    const context = executionContextCollection.get(contextId);
    if (!context) {
      logError('Tried to popImmediate context that was not registered:', contextId);
      return;
    }

    const rootContextId = this._executingContextRoot?.rootContextId;
    if (context.rootContextId !== rootContextId) {
      logError('Tried to popImmediate context whose rootContextId does not match executingContextRoot - ', contextId, '!==', rootContextId);
      return;
    }

    // misc updates
    --this._executingDepth;
    if (!this._executingDepth) {
      // last on stack
      this._executingContextRoot = null;
    }

    // log event
    executionEventCollection.logPopImmediate(ExecutionEventType.PopImmediate, contextId, this._executingDepth);
    // TODO
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