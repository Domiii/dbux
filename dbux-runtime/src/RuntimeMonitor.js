import programStaticContextCollection from './data/collections/programStaticContextCollection';
import ProgramMonitor from './ProgramMonitor';
import { logInternalError } from './log/logger';
import executionContextCollection from './data/collections/executionContextCollection';
import executionEventCollection from './data/collections/executionEventCollection';
import staticContextCollection from './data/collections/staticContextCollection';
import Stack from './Stack';

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
   * @type {Set<Stack>}
   */
  _activeStacks = new Set();

  /**
   * The currently executing stack.
   * @type {Stack}
   */
  _executingStack = null;

  _programMonitors = new Map();


  // ###########################################################################
  // Misc bookkeeping
  // ###########################################################################

  // getContext(contextId) {
  //   return this._contexts;
  // }

  /**
   * @returns {ProgramMonitor}
   */
  addProgram(programData) {
    const programStaticContext = programStaticContextCollection.addProgram(programData);
    staticContextCollection.addContexts(programStaticContext.programId, programData.staticContexts);
    const programMonitor = new ProgramMonitor(programStaticContext);
    this._programMonitors.set(programStaticContext.programId, programMonitor);
    return programMonitor;
  }

  _push(contextId) {
    if (!this._executingStack) {
      // no executing stack 
      //    -> this invocation has been called from system scheduler (possibly traversing blackboxed code)
      this._executingStack = new Stack();
      this._activeStacks.add(this._executingStack);
    }
    this._executingStack.push(contextId);
  }

  _pop(contextId) {
    const stackTopId = this._executingStack?.pop();
    if (contextId !== stackTopId) {
      logInternalError(
        'Tried to popImmediate context whose contextId does not match contextId on stack - ',
        contextId, '!==', stackTopId);
      return;
    }

    if (!this._executingStack.getDepth()) {
      // last on stack
      this._activeStacks.delete(this._executingStack);
      this._executingStack = null;
    }
  }


  // ###########################################################################
  // public interface
  // ###########################################################################

  /**
   * Very similar to `pushCallback`
   */
  pushImmediate(programId, staticContextId) {
    const parentId = this._executingStack?.peek();
    const stackDepth = this._executingStack?.getDepth() || 0;

    // register context
    const context = executionContextCollection.executeImmediate(stackDepth, programId, staticContextId, parentId);
    const { contextId } = context;
    this._push(contextId);

    // log event
    executionEventCollection.logPushImmediate(contextId);
    
    return contextId;
  }


  popImmediate(contextId) {
    // sanity checks
    const context = executionContextCollection.getContext(contextId);
    if (!context) {
      logInternalError('Tried to popImmediate, but context was not registered:', contextId);
      return;
    }

    // pop from stack
    this._pop(contextId);

    // log event
    executionEventCollection.logPopImmediate(contextId);
  }

  
  // ###########################################################################
  // Schedule callbacks
  // ###########################################################################

  /**
   * Push a new context for a scheduled callback for later execution.
   */
  scheduleCallback(programId, staticContextId, schedulerId, cb) {
    const parentId = this._executingStack?.peek();
    const stackDepth = this._executingStack?.getDepth() || 0;

    const scheduledContext = executionContextCollection.scheduleCallback(stackDepth,
      programId, staticContextId, parentId, schedulerId);
    const { contextId: scheduledContextId } = scheduledContext;
    const wrapper = this.makeCallbackWrapper(scheduledContextId, cb);

    // log event
    executionEventCollection.logScheduleCallback(scheduledContextId);

    return wrapper;
  }
  
  makeCallbackWrapper(scheduledContextId, cb) {
    return (...args) => {
      /**
       * We need this so we can always make sure we can link things back to the scheduler,
       * even if the callback declaration is not inline.
       */
      const callbackContextId = this.pushCallback(scheduledContextId);

      try {
        return cb(...args);
      }
      finally {
        this.popCallback(callbackContextId);
      }
    };
  }

  /**
   * Very similar to `pushImmediate`.
   * We need it to establish the link with it's scheduling context.
   */
  pushCallback(scheduledContextId) {
    const parentId = this._executingStack?.peek();
    const stackDepth = this._executingStack?.getDepth() || 0;

    // register context
    const context = executionContextCollection.executeCallback(stackDepth, scheduledContextId, parentId);
    const { contextId: callbackContextId } = context;
    this._push(callbackContextId);

    // log event
    executionEventCollection.logPushCallback(callbackContextId);

    return callbackContextId;
  }

  popCallback(callbackContextId) {
    // sanity checks
    const context = executionContextCollection.getContext(callbackContextId);
    if (!context) {
      logInternalError('Tried to popCallback, but context was not registered:', callbackContextId);
      return;
    }

    // pop from stack
    this._pop(callbackContextId);

    // log event
    executionEventCollection.logPopCallback(callbackContextId);
  }
}