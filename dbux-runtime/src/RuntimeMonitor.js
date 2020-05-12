import { logInternalError } from 'dbux-common/src/log/logger';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';
import TraceType, { isReturnTrace } from 'dbux-common/src/core/constants/TraceType';
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
    const { contexts: staticContexts, traces: staticTraces } = programData;
    staticContextCollection.addEntries(programId, staticContexts);

    // change program-local _staticContextId to globally unique staticContextId
    for (let i = 0; i < staticTraces.length; ++i) {
      const staticTrace = staticTraces[i];
      let staticContext = staticContextCollection.getContext(programId, staticTrace._staticContextId);
      if (!staticContext?.staticId) {
        // set to random default, to avoid more errors down the line?
        staticContext = staticContextCollection.getContext(programId, 1);
        logInternalError('trace had invalid `_staticContextId`', staticTrace);
      }
      delete staticTrace._staticContextId;
      staticTrace.staticContextId = staticContext.staticId;
    }
    staticTraceCollection.addEntries(programId, staticTraces);

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
    const parentTraceId = this._runtime.getLastTraceIdInContext(parentContextId);

    const context = executionContextCollection.executeImmediate(
      stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId
    );
    const { contextId } = context;
    this._runtime.push(contextId, isInterruptable);

    // trace
    this._trace(contextId, runId, inProgramStaticTraceId);

    return contextId;
  }


  popFunction(contextId, inProgramStaticTraceId) {
    // this.checkErrorOnFunctionExit(contextId, inProgramStaticTraceId);
    return this.popImmediate(contextId, inProgramStaticTraceId);
  }

  popTry() {
    // TODO
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
    this._trace(contextId, runId, inProgramStaticTraceId, null, true);
  }

  _pop(contextId) {
    // executionContextCollection.setContextPopped(contextId);
    this._runtime.pop(contextId);
  }


  // ###########################################################################
  // Callbacks
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
        resultValue = cb.apply(this, args);
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

    // override name
    Object.defineProperty(wrappedCb, 'name', { value: cb.name });

    // basic inheritance es5 chain
    // TODO: support es6 classes as well
    _inheritsLoose(wrappedCb, cb);

    // copy all non-native properties of the function
    const props = Object.keys(cb);
    for (const prop of props) {
      wrappedCb[prop] = cb[prop];
    }

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
    const parentTraceId = this._runtime.getLastTraceIdInContext(parentContextId);

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
    this._onTrace(callbackContextId, traceId, true);
  }


  // ###########################################################################
  // Interrupts, await et al
  // ###########################################################################

  preAwait(programId, inProgramStaticId, inProgramStaticTraceId) {
    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const resumeContextId = this._runtime.peekCurrentContextId(); // NOTE: parent == Resume
    const parentTraceId = this._runtime.getLastTraceIdInContext(resumeContextId);

    // trace Await
    this._trace(resumeContextId, runId, inProgramStaticTraceId);

    // pop Resume context
    this.popResume(resumeContextId);

    // register Await context
    const parentContextId = this._runtime.peekCurrentContextId(); // NOTE: parent == Resume
    const context = executionContextCollection.await(
      stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId
    );
    const { contextId: awaitContextId } = context;
    this._runtime.registerAwait(awaitContextId);  // mark as "waiting"

    // manually climb up the stack
    this._runtime.skipPopPostAwait();

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
      // this._pop(awaitContextId);

      // resume: push new Resume context
      const { staticContextId } = context;
      const staticContext = staticContextCollection.getById(staticContextId);
      const { resumeId: resumeStaticContextId } = staticContext;
      this.pushResume(programId, resumeStaticContextId, resumeInProgramStaticTraceId);
    }

    return awaitResult;
  }

  
  pushResume(programId, resumeStaticContextId, inProgramStaticTraceId, dontTrace = false) {
    this._runtime.beforePush(null);

    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const parentContextId = this._runtime.peekCurrentContextId();
    const parentTraceId = this._runtime.getLastTraceIdInContext(parentContextId);

    // NOTE: we don't really need a `schedulerTraceId`, since the parent context is always the calling function
    const schedulerTraceId = null;
    const resumeContext = executionContextCollection.resume(
      stackDepth, runId, parentContextId, parentTraceId, programId, resumeStaticContextId, schedulerTraceId
    );

    const { contextId: resumeContextId } = resumeContext;
    this._runtime.push(resumeContextId);

    this._trace(resumeContextId, runId, inProgramStaticTraceId, TraceType.Resume);

    return resumeContextId;
  }

  popResume(resumeContextId = null) {
    // sanity checks
    if (resumeContextId === 0) {
      logInternalError('Tried to popResume, but id was 0. Is this an async function that started in an object getter?');
      return;
    }

    resumeContextId = resumeContextId || this._runtime.peekCurrentContextId();
    const context = executionContextCollection.getById(resumeContextId);

    // more sanity checks
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
      return value;
    }

    // if (value instanceof Function && !isClass(value)) {
    // if (value instanceof Function) {
    //   // NOTE: this would override TraceType, but TraceType must sometimes not be overridden (e.g. `ReturnArgument`)
    //   // scheduled callback
    //   const cb = value;
    //   return this._traceCallbackArgument(programId, inProgramStaticTraceId, cb);
    // }
    // else 
    {
      const contextId = this._runtime.peekCurrentContextId();
      const runId = this._runtime.getCurrentRunId();
      const overrideType = null;

      const { traceId } = traceCollection.traceWithResultValue(contextId, runId, inProgramStaticTraceId, overrideType, value);
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

    // const wrapper = this.makeCallbackWrapper(contextId, schedulerTraceId, inProgramStaticTraceId, cb);
    // return wrapper;

    return cb;
  }

  _trace(contextId, runId, inProgramStaticTraceId, traceType = null, isPop = false) {
    const trace = traceCollection.trace(contextId, runId, inProgramStaticTraceId, traceType);
    this._onTrace(contextId, trace.traceId, isPop);
    if (isPop) {
      trace.previousTrace = this._runtime.getLastTraceIdInContext(contextId);
    }
    return trace;
  }

  _onTrace(contextId, traceId, isPop = false) {
    if (isPop) {
      return; // we do not want to consider `pop`s as "last trace of a context" at any rate.
    }
    this._runtime.setLastContextTrace(contextId, traceId);
  }

  // ###########################################################################
  // varible tracking?
  // ###########################################################################

  // addVar(programId, inProgramStaticVarAccessId, value) {
  //   const staticVar = staticVarAccessCollection.getVar(programId, inProgramStaticVarAccessId);
  //   const { staticVarId } = staticVar;

  //   // const loopIterationId = ...;
  //   // const varAccess = varAccessCollection.addVar(staticVarId, value);
  // }

  // ###########################################################################
  // error handling
  // ###########################################################################

  // // TODO: try instrumentation

  // isTryExitTrace(traceId) {
  //   if (!traceId) {
  //     // NOTE: even empty try blocks have a sentinel
  //     return true;
  //   }
  //   const trace = traceCollection.getById(traceId);
  //   const { staticTraceId } = trace;
  //   const staticTrace = staticTraceCollection.getById(staticTraceId);
  //   return staticTrace.isTryExit;
  // }

  // checkErrorOnTryExit(contextId) {
  //   const context = executionContextCollection.getById(contextId);
  //   const { lastTraceId } = context;

  //   const hasError = !this.isTryExitTrace(lastTraceId);
  //   traceCollection.setTraceErrorStatus(context.lastTraceId, hasError);
  // }


  // ###########################################################################
  // loops
  // ###########################################################################


  // TODO: loops!

  async* wrapAsyncIterator(it) {
    for (const promise of it) {
      // wrap await
      let awaitContextId;
      const result = this.postAwait(
        await this.wrapAwait(promise, awaitContextId = this.preAwait(staticId, preTraceId)),
        awaitContextId,
        resumeTraceId
      );

      // TODO: register loop iteration here
      const vars = [result];

      yield result;
    }
  }

  beforeLoopStart() {
  }

  pushLoop() {
  }

  popLoop() {
  }

  // ###########################################################################
  // internally used stuff
  // ###########################################################################

  disabled;

  setDisabled(disabled) {
    this.disabled = disabled;
  }
}