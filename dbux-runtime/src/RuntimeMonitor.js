import { logInternalError } from 'dbux-common/src/log/logger';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import staticProgramContextCollection from './data/staticProgramContextCollection';
import executionContextCollection from './data/executionContextCollection';
import staticContextCollection from './data/staticContextCollection';
import traceCollection from './data/traceCollection';
import staticTraceCollection from './data/staticTraceCollection';
import Runtime from './Runtime';
import ProgramMonitor from './ProgramMonitor';

function _inheritsLoose(subClass, superClass) {
  if (superClass.prototype) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }
}

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
    const { programId } = staticProgramContext;
    const { staticContexts, traces: staticTraces } = programData;
    staticContextCollection.addContexts(programId, staticContexts);

    // change program-local _staticContextId to globally unique staticContextId
    for (let i = 1; i < staticTraces.length; ++i) {
      const staticTrace = staticTraces[i];
      let staticContext = staticContexts[staticTrace._staticContextId];
      if (!staticContext?.staticId) {
        // set to random default, to avoid more errors down the line?
        staticContext = staticContexts[1];
        logInternalError('trace had invalid `_staticContextId`', staticTrace);
      }
      delete staticTrace._staticContextId;
      staticTrace.staticContextId = staticContext.staticId;
    }
    staticTraceCollection.addTraces(programId, staticTraces);

    const programMonitor = new ProgramMonitor(this, staticProgramContext);
    this._programMonitors.set(programId, programMonitor);

    return programMonitor;
  }

  // ###########################################################################
  // public interface
  // ###########################################################################

  /**
   * Very similar to `pushCallback`
   */
  pushImmediate(programId, inProgramStaticId, inProgramStaticTraceId, isInterruptable) {
    this._runtime.beforePush(null);

    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const parentContextId = this._runtime.peekCurrentContextId();
    const parentTraceId = this._runtime.getContextTraceId(parentContextId);

    const context = executionContextCollection.executeImmediate(
      stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId
    );
    const { contextId } = context;
    this._runtime.push(contextId, isInterruptable);

    // trace
    this._trace(contextId, runId, inProgramStaticTraceId);

    return contextId;
  }


  popImmediate(contextId, inProgramStaticTraceId) {
    // sanity checks
    const context = executionContextCollection.getById(contextId);
    if (!context) {
      logInternalError('Tried to popImmediate, but context was not registered:', contextId);
      return;
    }

    // pop from stack
    this._pop(contextId);

    // trace
    const runId = this._runtime.getCurrentRunId();
    this._trace(contextId, runId, inProgramStaticTraceId);
  }

  _pop(contextId) {
    // executionContextCollection.setContextPopped(contextId);
    this._runtime.pop(contextId);
  }


  // ###########################################################################
  // Schedule callbacks
  // ###########################################################################

  makeCallbackWrapper(schedulerContextId, schedulerTraceId, inProgramStaticTraceId, cb) {
    // return WrappedClazz;
    const _this = this;
    const wrappedCb = function wrappedCb(...args) {
      /**
       * We need this so we can always make sure we can link things back to the scheduler,
       * even if the callback declaration is not inline.
       */
      const callbackContextId = _this.pushCallback(schedulerContextId, schedulerTraceId, inProgramStaticTraceId);

      let resultValue;
      try {
        resultValue = cb(...args);
        if (this && resultValue === undefined) {
          // not quite sure why - that's what babel preset-env does
          return this;
        }
        return resultValue;
      }
      finally {
        _this.popCallback(callbackContextId, inProgramStaticTraceId, resultValue);
      }
    };
    _inheritsLoose(wrappedCb, cb);
    return wrappedCb;
  }

  /**
   * Very similar to `pushImmediate`.
   * We need it to establish the link with it's scheduling context.
   */
  pushCallback(schedulerContextId, schedulerTraceId, inProgramStaticTraceId) {
    this._runtime.beforePush(null);

    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const parentContextId = this._runtime.peekCurrentContextId();
    const parentTraceId = this._runtime.getContextTraceId(parentContextId);

    // register context
    // console.debug('pushCallback', { parentContextId, schedulerContextId, schedulerTraceId });
    const context = executionContextCollection.executeCallback(
      stackDepth, runId, parentContextId, parentTraceId, schedulerContextId, schedulerTraceId
    );
    const { contextId } = context;
    this._runtime.push(contextId);

    // trace
    this._trace(contextId, runId, inProgramStaticTraceId, TraceType.PushCallback);

    return contextId;
  }

  popCallback(callbackContextId, inProgramTraceId, resultValue) {
    // sanity checks
    const context = executionContextCollection.getById(callbackContextId);
    if (!context) {
      logInternalError('Tried to popCallback, but context was not registered:',
        callbackContextId);
      return;
    }

    const runId = this._runtime.getCurrentRunId(); // get runId before pop

    // pop from stack
    this._pop(callbackContextId);

    // trace
    const { traceId } = traceCollection.traceWithResultValue(callbackContextId, runId, inProgramTraceId, TraceType.PopCallback, resultValue);
    this._onTrace(callbackContextId, traceId);
  }


  // ###########################################################################
  // Interrupts, await et al
  // ###########################################################################

  preAwait(programId, inProgramStaticId, inProgramStaticTraceId) {
    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const parentContextId = this._runtime.peekCurrentContextId(); // NOTE: parent == Resume
    const parentTraceId = this._runtime.getContextTraceId(parentContextId);

    const context = executionContextCollection.await(
      stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId
    );
    const { contextId: awaitContextId } = context;

    // NOTE: register + push await context, then mark as waiting
    this._runtime.registerAwait(awaitContextId);  // mark as "waiting"
    
    // trace Await
    this._trace(parentContextId, runId, inProgramStaticTraceId);

    // pop resume context
    this.popResume(parentContextId);

    return awaitContextId;
  }

  wrapAwait(programId, awaitValue, awaitContextId) {
    // nothing to do
    return awaitValue;
  }

  /**
   * Resume given stack
   */
  postAwait(programId, awaitResult, awaitContextId, resumeInProgramStaticTraceId) {
    // sanity checks
    const context = executionContextCollection.getById(awaitContextId);
    if (!context) {
      logInternalError('Tried to postAwait, but context was not registered:', awaitContextId);
    }
    else {
      // resume after await
      this._runtime.resumeWaitingStack(awaitContextId);

      // traceCollection.trace(awaitContextId, runId, inProgramStaticTraceId, TraceType.Await);
      this._pop(awaitContextId);

      // resume: push new Resume context
      const { staticContextId } = context;
      const staticContext = staticContextCollection.getById(staticContextId);
      const { resumeId: resumeStaticContextId } = staticContext;
      this.pushResume(programId, resumeStaticContextId, resumeInProgramStaticTraceId);
    }

    return awaitResult;
  }

  /**
   * The `schedulerId` of a `resume` can be two things:
   * (1) the function itself (when pushing the initial "resume context" on function call)
   * (2) an await context (when resuming after an await)
   */
  pushResume(programId, resumeStaticContextId, inProgramStaticTraceId, dontTrace = false) {
    this._runtime.beforePush(null);

    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const parentContextId = this._runtime.peekCurrentContextId();
    const parentTraceId = this._runtime.getContextTraceId(parentContextId);

    // NOTE: we don't really need a `schedulerTraceId`, since the parent context is always the calling function
    const schedulerTraceId = null;
    const resumeContext = executionContextCollection.resume(
      stackDepth, runId, parentContextId, parentTraceId, programId, resumeStaticContextId, schedulerTraceId
    );

    const { contextId: resumeContextId } = resumeContext;
    this._runtime.push(resumeContextId);

    // if (!dontTrace) { // NOTE: We don't want to trace when pushing the default Resume context of an interruptable function
    // trace
    this._trace(resumeContextId, runId, inProgramStaticTraceId, TraceType.Resume);
    // }
  }

  popResume(resumeContextId) {
    // const resumeContextId = this._runtime.peekCurrentContextId();

    // sanity checks
    const context = executionContextCollection.getById(resumeContextId);
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

  _ensureExecuting() {
    if (!this._runtime._executingStack) {
      console.error('Encountered trace when stack is empty');
      return false;
    }
    return true;
  }

  trace(programId, inProgramStaticTraceId) {
    if (!this._ensureExecuting()) {
      return;
    }
    const contextId = this._runtime.peekCurrentContextId();
    const runId = this._runtime.getCurrentRunId();
    this._trace(contextId, runId, inProgramStaticTraceId);
  }

  traceExpression(programId, inProgramStaticTraceId, value) {
    if (!this._ensureExecuting()) {
      return;
    }

    // if (value instanceof Function && !isClass(value)) {
    if (value instanceof Function) {
      // scheduled callback
      const cb = value;
      return this._traceCallbackArgument(programId, inProgramStaticTraceId, cb);
    }
    else {
      const contextId = this._runtime.peekCurrentContextId();
      const runId = this._runtime.getCurrentRunId();

      const { traceId } = traceCollection.traceWithResultValue(contextId, runId, inProgramStaticTraceId, null, value);
      this._onTrace(contextId, traceId);

      return value;
    }
  }

  traceArg(programId, inProgramStaticTraceId, value) {
    // currently behaves exactly the same as traceExpression
    return this.traceExpression(programId, inProgramStaticTraceId, value);
  }


  /**
   * Push a new context for a scheduled callback for later execution.
   */
  _traceCallbackArgument(programId, inProgramStaticTraceId, cb) {
    // trace
    const contextId = this._runtime.peekCurrentContextId();
    const runId = this._runtime.getCurrentRunId();

    const trace = traceCollection.traceWithResultValue(contextId, runId, inProgramStaticTraceId, TraceType.CallbackArgument, cb);
    const { traceId: schedulerTraceId } = trace;
    this._onTrace(contextId, schedulerTraceId);

    const wrapper = this.makeCallbackWrapper(contextId, schedulerTraceId, inProgramStaticTraceId, cb);

    return wrapper;
  }

  _trace(contextId, runId, inProgramStaticTraceId, traceType = null) {
    const trace = traceCollection.trace(contextId, runId, inProgramStaticTraceId, traceType);
    this._onTrace(contextId, trace.traceId);
    return trace;
  }

  _onTrace(contextId, traceId) {
    this._runtime.setContextTrace(contextId, traceId);
  }
}