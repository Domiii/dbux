import programStaticContextCollection from './data/collections/programStaticContextCollection';
import ProgramMonitor from './ProgramMonitor';
import { logInternalError } from './log/logger';
import executionContextCollection from './data/collections/executionContextCollection';
import executionEventCollection from './data/collections/executionEventCollection';
import staticContextCollection from './data/collections/staticContextCollection';
import Runtime from './Runtime';

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

  _programMonitors = new Map();
  _runtime = new Runtime();


  // ###########################################################################
  // Program management
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



  // ###########################################################################
  // public interface
  // ###########################################################################

  /**
   * Very similar to `pushCallback`
   */
  pushImmediate(programId, staticContextId) {
    const parentContextId = this._runtime.peekStack();
    const stackDepth = this._runtime.getStackDepth();

    // register context
    const context = executionContextCollection.executeImmediate(
      stackDepth, programId, staticContextId, parentContextId
    );
    const { contextId } = context;
    this._runtime.push(contextId);

    // log event
    executionEventCollection.logPushImmediate(contextId);

    return contextId;
  }


  popImmediate(contextId) {
    // sanity checks
    const context = executionContextCollection.getContext(contextId);
    if (!context) {
      logInternalError('Tried to popImmediate, but context was not registered:',
        contextId);
      return;
    }

    // pop from stack
    this._runtime.pop(contextId);

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
    const parentContextId = this._runtime.peekStack();
    const stackDepth = this._runtime.getStackDepth();

    const scheduledContext = executionContextCollection.scheduleCallback(stackDepth,
      programId, staticContextId, parentContextId, schedulerId);
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
    const parentContextId = this._runtime.peekStack();
    const stackDepth = this._runtime.getStackDepth();

    // register context
    const context = executionContextCollection.executeCallback(
      stackDepth, scheduledContextId, parentContextId
    );
    const { contextId: callbackContextId } = context;
    this._runtime.push(callbackContextId);

    // log event
    executionEventCollection.logPushCallback(callbackContextId);

    return callbackContextId;
  }

  popCallback(callbackContextId) {
    // sanity checks
    const context = executionContextCollection.getContext(callbackContextId);
    if (!context) {
      logInternalError('Tried to popCallback, but context was not registered:', 
        callbackContextId);
      return;
    }

    // pop from stack
    this._runtime.pop(callbackContextId);

    // log event
    executionEventCollection.logPopCallback(callbackContextId);
  }


  // ###########################################################################
  // Interrupts, await et al
  // ###########################################################################

  awaitId(programId, staticContextId) {
    // TODO: flag stack for interruption
    const parentContextId = this._runtime.peekStack();
    const stackDepth = this._runtime.getStackDepth();

    // register context
    const context = executionContextCollection.interrupt(
      stackDepth, programId, staticContextId, parentContextId
    );
    const { contextId } = context;
    this._runtime.push(contextId);

    
    return contextId;
  }
  
  wrapAwait(programId, awaitContextId, awaitValue) {
    if (this._runtime.isExecuting()) {
      this._runtime.interrupt();
    }
    
    // log event
    executionEventCollection.logInterrupt(awaitContextId);

    return awaitValue;
  }

  /**
   * Resume given stack
   */
  postAwait(awaitContextId) {
    // sanity checks
    const context = executionContextCollection.getContext(awaitContextId);
    if (!context) {
      logInternalError('Tried to postAwait, but context was not registered:', awaitContextId);
      return;
    }

    // pop it!
    this._runtime.pop(awaitContextId);
    // if (!this._runtime._tryResumeStack(awaitContextId)) {
    //   // something went wrong
    //   logInternalError('could not resume awaitContextId: ', awaitContextId);
    //   return;
    // }

    executionEventCollection.logResume(awaitContextId);
  }
}