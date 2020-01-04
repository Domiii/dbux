import staticProgramContextCollection from './data/collections/staticProgramContextCollection';
import ProgramMonitor from './ProgramMonitor';
import { logInternalError } from './log/logger';
import executionContextCollection, { ExecutionContextType } from './data/collections/executionContextCollection';
import executionEventCollection from './data/collections/executionEventCollection';
import staticContextCollection from './data/collections/staticContextCollection';
import Runtime from './Runtime';
import traceCollection from './data/collections/traceCollection';

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
    const staticProgramContext = staticProgramContextCollection.addProgram(programData);
    staticContextCollection.addContexts(staticProgramContext.programId, programData.staticContexts);
    const programMonitor = new ProgramMonitor(staticProgramContext);
    this._programMonitors.set(staticProgramContext.programId, programMonitor);
    return programMonitor;
  }



  // ###########################################################################
  // public interface
  // ###########################################################################

  /**
   * Very similar to `pushCallback`
   */
  pushImmediate(programId, staticContextId, isInterruptable = 0) {
    const parentContextId = this._runtime.peekStack();
    const stackDepth = this._runtime.getStackDepth();
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
      logInternalError('Tried to popImmediate, but context was not registered:', contextId);
      return;
    }



    // pop from stack
    this._pop(contextId);

    // log event
    executionEventCollection.logPopImmediate(contextId);
  }

  _pop(contextId) {
    // executionContextCollection.setContextPopped(contextId);
    this._runtime.pop(contextId);
  }


  // ###########################################################################
  // Schedule callbacks
  // ###########################################################################

  /**
   * Push a new context for a scheduled callback for later execution.
   */
  scheduleCallback(programId, staticContextId, schedulerId, cb) {
    this._runtime.beforePush(schedulerId);

    const parentContextId = this._runtime.peekStack();
    const stackDepth = this._runtime.getStackDepth();

    const scheduledContext = executionContextCollection.scheduleCallback(stackDepth,
      programId, staticContextId, parentContextId, schedulerId);
    const { contextId: scheduledContextId } = scheduledContext;
    const wrapper = this.makeCallbackWrapper(scheduledContextId, cb);

    this._runtime.push(scheduledContextId);
    this._runtime.scheduleCallback(scheduledContextId);

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
    this._runtime.beforePush(scheduledContextId);

    const parentContextId = this._runtime.peekStack();
    const stackDepth = this._runtime.getStackDepth();
    // let stackDepth = this._runtime._executingStack.indexOf(scheduledContextId);

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
    this._pop(callbackContextId);

    // log event
    executionEventCollection.logPopCallback(callbackContextId);
  }


  // ###########################################################################
  // Interrupts, await et al
  // ###########################################################################

  preAwait(programId, staticContextId) {
    // pop resume context
    this.popResume();

    // push await context
    this._runtime.beforePush(null);
    const parentContextId = this._runtime.peekStack();
    const stackDepth = this._runtime.getStackDepth();
    const context = executionContextCollection.await(
      stackDepth, programId, staticContextId, parentContextId
    );
    const { contextId: awaitContextId } = context;
    this._runtime.push(awaitContextId);
    this._runtime.registerAwait(awaitContextId);  // let run-time now that this is gonna be "waiting"

    // log event
    executionEventCollection.logAwait(awaitContextId);

    return awaitContextId;
  }

  wrapAwait(programId, awaitContextId, awaitValue) {
    // nothing to do...
    return awaitValue;
  }

  /**
   * Resume given stack
   */
  postAwait(awaitResult, awaitContextId) {
    // sanity checks
    const context = executionContextCollection.getContext(awaitContextId);
    if (!context) {
      logInternalError('Tried to postAwait, but context was not registered:', awaitContextId);
      return;
    }

    // bring back stack of awaiting context
    this._runtime.resumeWaitingStack(awaitContextId);

    // pop from stack
    this._pop(awaitContextId);

    // resume: insert new [Resume] context and add as resumedChild
    const { programId, staticContextId } = context;
    const staticContext = staticContextCollection.getContext(programId, staticContextId);
    const { resumeId: resumeStaticContextId } = staticContext;
    this.pushResume(resumeStaticContextId, awaitContextId);

    return awaitResult;
  }

  /**
   * The `schedulerId` of a `resume` can be two things:
   * (1) the function itself (when pushing the initial "resume context" on function call)
   * (2) an await context (when resuming after an await)
   */
  pushResume(resumeStaticContextId, schedulerId) {
    const parentContextId = this._runtime.peekStack();
    const stackDepth = this._runtime.getStackDepth();
    const resumeContextId = executionContextCollection.resume(
      parentContextId, resumeStaticContextId, schedulerId, stackDepth
    );

    // log event
    executionEventCollection.logResume(resumeContextId);
  }

  popResume() {
    const resumeContextId = this._runtime.peekStack();

    // sanity checks
    const context = executionContextCollection.getContext(resumeContextId);
    if (!context) {
      logInternalError('Tried to popResume, but context was not registered:', resumeContextId);
      return;
    }
    if (context.contextType !== ExecutionContextType.Resume) {
      logInternalError('Tried to popResume, but stack top is not of type `Resume`:', context);
      return;
    }

    this._pop(resumeContextId);
  }

  // ###########################################################################
  // traces
  // ###########################################################################

  trace(traceId, value) {
    const contextId = this._runtime.getCurrentContextId();
    traceCollection.recordTrace(contextId, traceId, value);
  }
}