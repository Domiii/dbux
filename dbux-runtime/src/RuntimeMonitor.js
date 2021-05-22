import { newLogger } from '@dbux/common/src/log/logger';
import ExecutionContextType from '@dbux/common/src/core/constants/ExecutionContextType';
import TraceType, { isBeforeCallExpression } from '@dbux/common/src/core/constants/TraceType';
import staticProgramContextCollection from './data/staticProgramContextCollection';
import executionContextCollection from './data/executionContextCollection';
import staticContextCollection from './data/staticContextCollection';
import traceCollection from './data/traceCollection';
import staticTraceCollection from './data/staticTraceCollection';
import Runtime from './Runtime';
import ProgramMonitor from './ProgramMonitor';
import dataNodeCollection from './data/dataNodeCollection';
import valueCollection from './data/valueCollection';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('RM');

// const Verbose = 0;
// const Verbose = 1;
const Verbose = 2;

// TODO: we can properly use Proxy to wrap callbacks
// function _inheritsLoose(subClass, superClass) {
//   if (superClass.prototype) {
//     subClass.prototype = Object.create(superClass.prototype);
//     subClass.prototype.constructor = subClass;

//     // eslint-disable-next-line no-proto
//     subClass.__proto__ = superClass;
//   }
// }

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
  addProgram(programData, runtimeCfg) {
    // read cfg
    const {
      tracesDisabled,
      valuesDisabled
    } = runtimeCfg;
    this.tracesDisabled = !!tracesDisabled + 0;
    this.valuesDisabled = !!valuesDisabled + 0;

    // go!
    const staticProgramContext = staticProgramContextCollection.addProgram(programData);
    const { programId } = staticProgramContext;
    const { contexts: staticContexts, traces: staticTraces } = programData;
    staticContextCollection.addEntries(programId, staticContexts);


    Verbose && debug(`addProgram ${programId}: ${programData.fileName}`); // (td=${!!runtimeCfg.tracesDisabled})

    // change program-local _staticContextId to globally unique staticContextId
    for (let i = 0; i < staticTraces.length; ++i) {
      const staticTrace = staticTraces[i];
      let staticContext = staticContextCollection.getContext(programId, staticTrace._staticContextId);
      if (!staticContext?.staticId) {
        // set to random default, to avoid more errors down the line?
        staticContext = staticContextCollection.getContext(programId, 1);
        logError('trace had invalid `_staticContextId`', staticTrace);
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
  pushImmediate(programId, inProgramStaticContextId, inProgramStaticTraceId, isInterruptable, tracesDisabled) {
    this._runtime.beforePush(null);

    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const parentContextId = this._runtime.peekCurrentContextId();
    const parentTraceId = this._runtime.getParentTraceId();

    if (Verbose) {
      const staticContext = staticContextCollection.getContext(programId, inProgramStaticContextId);
      debug(
        // ${JSON.stringify(staticContext)}
        `pushImmediate ${programId}.${inProgramStaticContextId} ${staticContext?.displayName} (${runId}))`
      );
    }

    const context = executionContextCollection.executeImmediate(
      stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticContextId, tracesDisabled
    );
    const { contextId } = context;
    this._runtime.push(contextId, isInterruptable);

    // trace
    this._trace(programId, contextId, runId, inProgramStaticTraceId);

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
      logError('Tried to popImmediate, but context was not registered:', contextId);
      return;
    }

    // pop from stack
    this._pop(contextId);

    // trace
    const runId = this._runtime.getCurrentRunId();
    const programId = executionContextCollection.getProgramId(contextId);

    if (Verbose) {
      const { staticContextId } = context;
      const staticContext = staticContextCollection.getById(staticContextId);
      debug(
        // ${JSON.stringify(staticContext)}
        `popImmediate ${programId}.${staticContext._staticId} ${staticContext?.displayName} (${runId}))`
      );
    }

    this._trace(programId, contextId, runId, inProgramStaticTraceId, null, true);
  }

  _pop(contextId) {
    // executionContextCollection.setContextPopped(contextId);
    this._runtime.pop(contextId);
  }


  // ###########################################################################
  // Callbacks
  // ###########################################################################

  // makeCallbackWrapper(programId, schedulerContextId, schedulerTraceId, inProgramStaticTraceId, cb) {
  //   // return WrappedClazz;
  //   const _this = this;
  //   const wrappedCb = function wrappedCb(...args) {
  //     /**
  //      * We need this so we can always make sure we can link things back to the scheduler,
  //      * even if the callback declaration is not inline.
  //      */
  //     // const tracesDisabled = ???;
  //     // const callbackContextId = _this.pushCallback(programId, schedulerContextId, schedulerTraceId, inProgramStaticTraceId);

  //     // let resultValue;
  //     // try {
  //     //   resultValue = cb.apply(this, args);
  //     //   if (this && resultValue === undefined) {
  //     //     return this;
  //     //   }
  //     //   return resultValue;
  //     // }
  //     // finally {
  //     //   _this.popCallback(programId, callbackContextId, inProgramStaticTraceId, resultValue);
  //     // }
  //   };

  //   // override name
  //   Object.defineProperty(wrappedCb, 'name', { value: cb.name });

  //   // basic inheritance es5 chain
  //   // TODO: support es6 classes as well
  //   _inheritsLoose(wrappedCb, cb);

  //   // copy all non-native properties of the function
  //   const props = Object.keys(cb);
  //   for (const prop of props) {
  //     wrappedCb[prop] = cb[prop];
  //   }

  //   return wrappedCb;
  // }

  // /**
  //  * Very similar to `pushImmediate`.
  //  * We need it to establish the link with it's scheduling context.
  //  */
  // pushCallback(programId, schedulerContextId, schedulerTraceId, inProgramStaticTraceId, tracesDisabled) {
  //   this._runtime.beforePush(null);

  //   const stackDepth = this._runtime.getStackDepth();
  //   const runId = this._runtime.getCurrentRunId();
  //   const parentContextId = this._runtime.peekCurrentContextId();
  //   const parentTraceId = this._runtime.getParentTraceId();

  //   // register context
  //   // console.debug('pushCallback', { parentContextId, schedulerContextId, schedulerTraceId });
  //   const context = executionContextCollection.executeCallback(
  //     stackDepth, runId, parentContextId, parentTraceId, schedulerContextId, schedulerTraceId, tracesDisabled
  //   );
  //   const { contextId } = context;
  //   this._runtime.push(contextId);

  //   // trace
  //   this._trace(programId, contextId, runId, inProgramStaticTraceId, TraceType.PushCallback);

  //   return contextId;
  // }

  // popCallback(programId, callbackContextId, inProgramTraceId, resultValue) {
  //   // sanity checks
  //   const context = executionContextCollection.getById(callbackContextId);
  //   if (!context) {
  //     logError('Tried to popCallback, but context was not registered:',
  //       callbackContextId);
  //     return;
  //   }

  //   const runId = this._runtime.getCurrentRunId(); // get runId before pop

  //   // pop from stack
  //   this._pop(callbackContextId);

  //   // trace
  //   const trace = traceCollection.traceWithResultValue(programId, callbackContextId, runId, inProgramTraceId, TraceType.PopCallback, resultValue, this.valuesDisabled);
  //   this._onTrace(callbackContextId, trace, true);
  // }


  // ###########################################################################
  // Interrupts, await et al
  // ###########################################################################

  preAwait(programId, inProgramStaticContextId, inProgramStaticTraceId) {
    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const resumeContextId = this._runtime.peekCurrentContextId(); // NOTE: parent == Resume
    const parentTraceId = this._runtime.getParentTraceId();

    // trace Await
    this._trace(programId, resumeContextId, runId, inProgramStaticTraceId);

    // pop Resume context
    this.popResume(resumeContextId);

    // register Await context
    const parentContextId = this._runtime.peekCurrentContextId(); // NOTE: parent == Resume
    const context = executionContextCollection.await(
      stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticContextId
    );
    const { contextId: awaitContextId } = context;
    this._runtime.registerAwait(awaitContextId);  // mark as "waiting"

    // manually climb up the stack
    this._runtime.skipPopPostAwait();

    return awaitContextId;
  }

  wrapAwait(programId, awaitValue, /* awaitContextId */) {
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
      logError('Tried to postAwait, but context was not registered:', awaitContextId);
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


  pushResume(programId, resumeStaticContextId, inProgramStaticTraceId/* , dontTrace = false */) {
    this._runtime.beforePush(null);

    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const parentContextId = this._runtime.peekCurrentContextId();
    const parentTraceId = this._runtime.getParentTraceId();

    // NOTE: we don't really need a `schedulerTraceId`, since the parent context is always the calling function
    const schedulerTraceId = null;
    const resumeContext = executionContextCollection.resume(
      stackDepth, runId, parentContextId, parentTraceId, programId, resumeStaticContextId, schedulerTraceId
    );

    const { contextId: resumeContextId } = resumeContext;
    this._runtime.push(resumeContextId);

    this._trace(programId, resumeContextId, runId, inProgramStaticTraceId, TraceType.Resume);

    return resumeContextId;
  }

  popResume(resumeContextId = null) {
    // sanity checks
    if (resumeContextId === 0) {
      logError('Tried to popResume, but id was 0. Is this an async function that started in an object getter?');
      return;
    }

    resumeContextId = resumeContextId || this._runtime.peekCurrentContextId();
    const context = executionContextCollection.getById(resumeContextId);

    // more sanity checks
    if (!context) {
      logError('Tried to popResume, but context was not registered:', resumeContextId);
      return;
    }
    if (context.contextType !== ExecutionContextType.Resume) {
      logError('Tried to popResume, but stack top is not of type `Resume`:', context);
      return;
    }

    this._pop(resumeContextId);
  }

  _ensureExecuting() {
    if (!this._runtime._executingStack) {
      logError('Encountered trace when stack is empty');
      return false;
    }
    return true;
  }

  logFail(msg) {
    this.logError(new Error(msg).stack);
  }

  // ###########################################################################
  // traces
  // ###########################################################################

  trace(programId, inProgramStaticTraceId) {
    if (!this._ensureExecuting()) {
      return;
    }
    const contextId = this._runtime.peekCurrentContextId();
    const runId = this._runtime.getCurrentRunId();
    this._trace(programId, contextId, runId, inProgramStaticTraceId);
  }

  newTraceId = (programId, inProgramStaticTraceId) => {
    if (!this._ensureExecuting()) {
      return -1;
    }

    const contextId = this._runtime.peekCurrentContextId();
    const runId = this._runtime.getCurrentRunId();
    const overrideType = null;

    const trace = traceCollection.trace(programId, contextId, runId, inProgramStaticTraceId, overrideType);
    this._onTrace(contextId, trace);

    return trace.traceId;
  }

  traceDeclaration(programId, tid) {
    if (!this._ensureExecuting()) {
      return;
    }
    if (!tid) {
      this.logFail(`traceExpression failed to capture tid`);
      return;
    }

    // this.registerTrace(value, tid);
    dataNodeCollection.createDataNodes(undefined, tid, tid);
  }

  traceExpression(programId, value, tid, bindingTid, inputs) {
    if (!this._ensureExecuting()) {
      return value;
    }
    if (!tid) {
      this.logFail(`traceExpression failed to capture tid`);
      return value;
    }

    // this.registerTrace(value, tid);
    dataNodeCollection.createDataNodes(value, tid, bindingTid, inputs);
    return value;
  }

  // registerTrace(value, tid) {
  //   const trace = traceCollection.getById(tid);
  // }

  // // TODO: traceME
  // traceME(value, objectTid, tid, memberPath, ...inputs) {
  // /* const trace =  */registerTrace(value, tid);
  //   const { refTid } = registerValue(tid, value);
  //   createDataNodes(tid, { objectTid, memberPath, refTid }, inputs);
  //   return value;
  // }

  // createWriteDataNodesX(value, trace, inputs) {
  //   const { tid } = trace;
  //   const staticTrace = getStaticTrace(trace);
  //   const { dataNode: staticDataNode } = staticTrace;

  //   const dataNode = createDataNode(tid, inputs);
  //   const deferredChildrenTids = getDeferredTids(tid);

  //   handleNodeX(value, trace, dataNode, inputs, deferredChildrenTids);
  // }

  // handleNodeX(value, trace, dataNode, inputs, deferredChildrenTids) {
  //   // TODO: varAccess{Id,ME}
  //   if (deferredChildrenTids) {
  //     // TODO: children
  //   }
  // }

  // traceWriteME(programId, value, tid/* , bindingTid, memberPath */, deferTid, inputs) {

  // TODO: rename to traceWriteVar
  traceWrite(programId, value, tid, bindingTid, deferTid, inputs) {
    if (!this._ensureExecuting()) {
      return value;
    }
    if (!tid) {
      this.logFail(`traceExpression failed to capture tid`);
      return value;
    }

    // this.registerTrace(value, tid);
    dataNodeCollection.createDataNodes(value, tid, bindingTid, inputs);

    // TODO: defer
    // if (deferTid) {
    //   addDeferredTid(deferTid, tid);
    // }
    // else {
    //   finishDataNode(tid);
    // }
    // return;
    return value;
  }

  /**
   * Called on the last node of a deferred chain, indicating that the sub-tree is complete.
   * NOTE: Might not need this...
   */
  finishDataNode(tid) {
    // const dataNode = getDataNode(tid);
    // const children = getDataNodeChildren(tid);
  }


  deferredTids = new Map();
  getDeferredTids(deferTid) {
    return this.deferredTids.get(deferTid);
  }

  addDeferredTid(deferTid, tid) {
    let tids = this.deferredTids.get(deferTid);
    if (!tids) {
      this.deferredTids.set(deferTid, tids = []);
    }
    tids.push(tid);
    return tids;
  }

  // ###########################################################################
  // traces (OLD)
  // ###########################################################################

  traceArg(programId, inProgramStaticTraceId, value) {
    // currently behaves exactly the same as traceExpression
    return this.traceExpression(programId, inProgramStaticTraceId, value);
  }


  // /**
  //  * Push a new context for a scheduled callback for later execution.
  //  */
  // _traceCallbackArgument(programId, inProgramStaticTraceId, cb) {
  //   // trace
  //   const contextId = this._runtime.peekCurrentContextId();
  //   const runId = this._runtime.getCurrentRunId();

  //   const schedulerTrace = traceCollection.traceWithResultValue(programId, contextId, runId, inProgramStaticTraceId, TraceType.CallbackArgument, cb, this.valuesDisabled);
  //   this._onTrace(contextId, schedulerTrace);

  //   // const wrapper = this.makeCallbackWrapper(programId, contextId, schedulerTraceId, inProgramStaticTraceId, cb);
  //   // return wrapper;

  //   return cb;
  // }

  _trace(programId, contextId, runId, inProgramStaticTraceId, traceType = null, isPop = false) {
    const trace = traceCollection.trace(programId, contextId, runId, inProgramStaticTraceId, traceType);

    // if (Verbose > 1) {
    //   const { staticContextId } = context;
    //   const staticContext = staticContextCollection.getById(staticContextId);
    //   debug(
    //     // ${JSON.stringify(staticContext)}
    //     `  t ${trace.traceId} ${staticContext?.displayName} (${runId}))`
    //   );
    // }

    this._onTrace(contextId, trace, isPop);
    if (isPop) {
      trace.previousTrace = this._runtime.getLastTraceInContext(contextId);
    }
    return trace;
  }

  _onTrace(contextId, trace, isPop = false) {
    if (isPop) {
      // NOTE: we do not want to consider `pop`s as "last trace of a context"
      return;
    }

    const { traceId, staticTraceId } = trace;
    const { type: traceType } = staticTraceCollection.getById(staticTraceId);
    if (isBeforeCallExpression(traceType)) {
      this._runtime.addBCEForContext(contextId, traceId);
    }
    this._runtime.setLastContextTrace(contextId, traceId);
  }

  // ###########################################################################
  // slicing
  // ###########################################################################

  // TODO

  /**
   *
   */
  logBinding() {
    /**
     * Examples of difficult bindings to deal with:
     * ```js
     * {
     *   const i = 3;
     * }
     * for (let i = 0; i < 10; ++i) {
     *   setTimeout(() => console.log(i), 100);
     * }
     * ```
     */
  }


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

  // async* wrapAsyncIterator(/* it */) {
  // TODO
  // for (const promise of it) {
  //   // wrap await
  //   let awaitContextId;
  //   const result = this.postAwait(
  //     await this.wrapAwait(promise, awaitContextId = this.preAwait(staticId, preTraceId)),
  //     awaitContextId,
  //     resumeTraceId
  //   );

  //   // TODO: register loop iteration here
  //   const vars = [result];

  //   yield result;
  // }
  // }

  beforeLoopStart() {
  }

  pushLoop() {
  }

  popLoop() {
  }

  // ###########################################################################
  // internally used stuff
  // ###########################################################################

  disabled = 0;
  tracesDisabled = 0;
  _valuesDisabled = 0;

  get valuesDisabled() {
    return this._valuesDisabled;
  }

  set valuesDisabled(val) {
    this._valuesDisabled = val;
    valueCollection.valuesDisabled = val;
  }

  incDisabled() {
    ++this.disabled;
    ++this.tracesDisabled;
  }

  decDisabled() {
    --this.disabled;
    --this.tracesDisabled;
  }

  incTracesDisabled() {
    ++this.tracesDisabled;
  }

  decTracesDisabled() {
    --this.tracesDisabled;
  }
}