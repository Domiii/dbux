import difference from 'lodash/difference';
import omit from 'lodash/omit';
import isFunction from 'lodash/isFunction';
import { newLogger } from '@dbux/common/src/log/logger';
import Trace from '@dbux/common/src/types/Trace';
import ExecutionContextType, { isResumeType, isVirtualContextType } from '@dbux/common/src/types/constants/ExecutionContextType';
import { isBeforeCallExpression, isPopTrace } from '@dbux/common/src/types/constants/TraceType';
// import SpecialIdentifierType from '@dbux/common/src/types/constants/SpecialIdentifierType';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import PatternAstNodeType, { isGroupPattern } from '@dbux/common/src/types/constants/PatternAstNodeType';
import isThenable from '@dbux/common/src/util/isThenable';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import NestedError from '@dbux/common/src/NestedError';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import staticProgramContextCollection from './data/staticProgramContextCollection';
import executionContextCollection from './data/executionContextCollection';
import staticContextCollection from './data/staticContextCollection';
import traceCollection from './data/traceCollection';
import staticTraceCollection from './data/staticTraceCollection';
import Runtime from './Runtime';
import ProgramMonitor from './ProgramMonitor';
import dataNodeCollection, { ShallowValueRefMeta } from './data/dataNodeCollection';
import valueCollection from './data/valueCollection';
import initPatchBuiltins from './builtIns/index';
import CallbackPatcher from './async/CallbackPatcher';
import initPatchPromise from './async/promisePatcher';
import { dataNode2String, getTraceStaticTrace } from './data/dataUtil';
import { getDefaultClient } from './client/index';
import { _slicedToArray } from './util/builtinUtil';
import { addPurpose } from './builtIns/builtin-util';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('RuntimeMonitor');

// const Verbose = 2;
// const Verbose = 1;
const Verbose = 0;
// const VerbosePatterns = 1;
const VerbosePatterns = 0;

const verboseDebug = (...args) => Verbose && debug(...args);

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
    return this._instance || (this._instance = new RuntimeMonitor()._init());
  }

  _programMonitors = new Map();
  _runtime = new Runtime();
  /**
   * @type {CallbackPatcher}
   */
  callbackPatcher;

  /**
   * @type {Runtime}
   */
  get runtime() {
    return this._runtime;
  }

  _init() {
    // monkey patching for asynchronous events
    initPatchPromise(this);
    this.callbackPatcher = new CallbackPatcher(this);
    this.callbackPatcher.init();

    // more monkey-patching
    initPatchBuiltins(this);

    return this;
  }

  getCurrentVirtualRootContextId() {
    return this._runtime.getCurrentVirtualRootContextId();
  }

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
      valuesDisabled,
      valuesShallow
    } = runtimeCfg;
    this.tracesDisabled = !!tracesDisabled + 0;

    // TODO: value config has been bugs since CallbackPatcher and PromisePatcher depend on valueCollection.
    this.valuesDisabled = !!valuesDisabled + 0;
    this.valuesShallow = !!valuesShallow + 0;

    // if (runtimeCfg || Verbose) {
    // _debug(`addProgram, runtimeCfg: ${JSON.stringify(runtimeCfg)}`);
    // }

    // go!
    const staticProgramContext = staticProgramContextCollection.addProgram(programData);
    const { programId } = staticProgramContext;
    const { contexts: staticContexts, traces: staticTraces } = programData;
    staticContextCollection.addEntries(programId, staticContexts);


    Verbose && verboseDebug(`addProgram ${programId}: ${programData.fileName}`);

    // change program-local _staticContextId to globally unique staticContextId
    for (let i = 0; i < staticTraces.length; ++i) {
      const staticTrace = staticTraces[i];
      let staticContext = staticContextCollection.getContext(programId, staticTrace._staticContextId);
      if (!staticContext?.staticId) {
        // set to random default, to avoid more errors down the line?
        staticContext = staticContextCollection.getContext(programId, 1);
        logTrace('trace had invalid `_staticContextId`', staticTrace);
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
  // context + function traces
  // ###########################################################################

  checkCanRecord() {
    return getDefaultClient().checkCanRecord();
  }

  _rootDisableCount = 0;

  /**
   * Start of function or file
   */
  pushImmediate(programId, inProgramStaticContextId, inProgramStaticTraceId, definitionTid, isInterruptable, tracesDisabled) {
    this._runtime.beforePush(null);

    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const parentContextId = this._runtime.fixPeekParentContextId();
    const parentTraceId = this._runtime.getParentTraceId();

    if (!parentContextId) {
      // → root
      /// // NOTE: bufferBreakpoint here would not make a difference in terms of performance
      // getDefaultClient().bufferBreakpoint();
      if (!this.checkCanRecord()) {
        // hackfix: omit root (safeguard against potential infinite loops)
        const staticContextId = staticContextCollection.getStaticContextId(programId, inProgramStaticContextId);
        const contextInfo = staticContextCollection.makeStaticContextInfo(staticContextId);
        warn(`[Root OMITTED] ${contextInfo}`);
        ++this._rootDisableCount;
        this.incBusy();
        return 0;
      }
      else {
        // normal root
        // const staticContextId = staticContextCollection.getStaticContextId(programId, inProgramStaticContextId);
        // const contextInfo = staticContextCollection.makeStaticContextInfo(staticContextId);
        // warn(`[Root] ${contextInfo}`);
      }
    }
    else if (this._rootDisableCount) {
      // if root was disabled, also disable all children
      ++this._rootDisableCount;
      return 0;
    }

    const context = executionContextCollection.pushImmediate(
      stackDepth, runId, parentContextId, parentTraceId, programId,
      inProgramStaticContextId, definitionTid, tracesDisabled
    );
    const { contextId } = context;

    // hackfix: link context to surrounding promise (if promise ctor executor on stack)
    // [edit-after-send]
    const promisifyPromiseVirtualRef = this._runtime.getPromisifyPromiseVirtualRef();
    promisifyPromiseVirtualRef?.add(context, 'data.promisifyId');

    if (!parentContextId) {
      this._runtime._updateVirtualRootContext(contextId);
    }
    this._runtime.push(contextId, isInterruptable || false);

    if (Verbose) {
      debug(
        // ${JSON.stringify(staticContext)}
        // eslint-disable-next-line max-len
        `>${' '.repeat(this.runtime._executingStack._stack?.length || 0)} ${executionContextCollection.makeContextInfo(contextId)} (pid=${programId}, pcid=${parentContextId})`
      );
      this.debugOnContextAdd(context);
    }

    this.newTraceId(programId, inProgramStaticTraceId);


    // this._trace(programId, contextId, runId, inProgramStaticTraceId);

    return contextId;
  }

  registerParams(programId, paramTids) {
    // nothing to do (for now)
  }

  traceReturn(programId, value, tid, inputs) {
    // for now: same as `te`
    this.traceExpression(programId, value, tid, inputs);
  }

  traceReturnAsync(programId, value, tid, inputs) {
    this.traceExpression(programId, value, tid, inputs);
    if (valueCollection.getIsThenable(value)) {
      this.runtime.async.returnAsync(value, tid);
    }
  }

  traceThrow(programId, value, tid, inputs) {
    // for now: same as `te`
    return this.traceExpression(programId, value, tid, inputs);
  }

  /**
   * Pop function.
   */
  popFunction(programId, realContextId, inProgramStaticTraceId) {
    let traceId;
    if (!this.areTracesDisabled) {
      try {
        traceId = this.newTraceId(programId, inProgramStaticTraceId);
      }
      catch (err) {
        throw new NestedError(`"popFunction" failed at context "${executionContextCollection.makeContextInfo(realContextId)}"`, err);
      }
    }

    // // NOTE: awaitContextIdVar might be 0
    // const shouldPopResume = awaitContextId !== undefined;

    return this.popImmediate(programId, realContextId);
  }

  /**
   * Pop function during `PostAwait` or after yield, but after error was thrown in inner `async` callee
   *        → need to handle `postAwait` here
   */
  popFunctionInterruptable(programId, realContextId, inProgramStaticTraceId, awaitContextId, inProgramStaticResumeContextId) {
    // this.checkErrorOnFunctionExit(contextId, inProgramStaticTraceId);
    this._fixContextAsync(programId, realContextId, awaitContextId);
    this._fixContextGen(programId, realContextId, inProgramStaticResumeContextId);

    this.popFunction(programId, realContextId, inProgramStaticTraceId);
  }

  /**
   * TODO: determine async program contexts?
   * 
   * Case 1: normal pop program.
   * Case 2: pop function during `PostAwait` event, but after error was thrown in inner `async` callee
   *        → need to handle `postAwait` here
   */
  popProgram(programId, realContextId, inProgramStaticTraceId) {
    // TODO: awaitContextId
    // this._fixContext(programId, realContextId, awaitContextId);
    let traceId;
    if (!this.areTracesDisabled) {
      try {
        traceId = this.newTraceId(programId, inProgramStaticTraceId);
      }
      catch (err) {
        throw new NestedError(`"popProgram" failed at context "${executionContextCollection.makeContextInfo(realContextId)}"`, err);
      }
    }
    return this.popImmediate(programId, realContextId);
  }

  popImmediate(programId, contextId) {
    if (this._rootDisableCount) {
      // context and its children were omitted
      --this._rootDisableCount;
      if (!this._rootDisableCount) {
        // this is the root that we first disabled on → re-enable.
        this.decBusy();
      }
      return;
    }

    // sanity checks
    const context = executionContextCollection.getById(contextId);
    if (!context) {
      logTrace('Tried to popImmediate, but context was not registered:', contextId);
      return;
    }

    if (isVirtualContextType(context.contextType)) {
      // interruptable function → handle pop resume instead
      this.popResume(this._runtime.peekCurrentContextId());
    }
    else {
      // just pop from stack
      if (Verbose) {
        verboseDebug(
          `<${' '.repeat(this.runtime._executingStack._stack?.length || 0)} ${executionContextCollection.makeContextInfo(contextId)} (pid=${programId})`
        );
      }
      this._pop(contextId);
    }

    // trace
    // const runId = this._runtime.getCurrentRunId();
    // const programId = executionContextCollection.getProgramId(contextId);

    // finishTrace (already done...)
    // const trace = traceCollection.getById(traceId);
    // this._onTrace(contextId, trace, true);
    // trace.previousTrace = this._runtime.getLastTraceInContext(contextId);

    // this._trace(programId, contextId, runId, inProgramStaticTraceId, null, true);
  }

  _pop(contextId) {
    // executionContextCollection.setContextPopped(contextId);
    this._runtime.pop(contextId);
  }


  // ###########################################################################
  // await
  // ###########################################################################

  preAwait(programId, inProgramStaticContextId, preAwaitTid, awaitArgument) {
    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const resumeContextId = this._runtime.peekCurrentContextId(); // NOTE: current context == Resume
    // const parentTraceId = this._runtime.getParentTraceId();
    const parentTraceId = preAwaitTid;

    // pop Resume context
    // should always exist
    const realContextId = executionContextCollection.getById(resumeContextId)?.realContextId || 0;
    this.popResume(resumeContextId);

    // register Await context
    const parentContextId = this._runtime.peekCurrentContextId(); // Real context
    const context = executionContextCollection.pushAwait(
      stackDepth, runId, realContextId, parentContextId, parentTraceId, programId, inProgramStaticContextId
    );
    const { contextId: awaitContextId } = context;
    this._runtime.registerAwait(awaitContextId, realContextId, awaitArgument);  // mark as "waiting"

    if (Verbose) {
      verboseDebug(
        // ${JSON.stringify(staticContext)}
        // eslint-disable-next-line max-len
        `[preAwait]${' '.repeat(this.runtime._executingStack._stack?.length || 0)} ${executionContextCollection.makeContextInfo(awaitContextId)} (pid=${programId}, realCid=${realContextId}, pcid=${parentContextId})`
      );
      this.debugOnContextAdd(context);
    }


    // manually climb up the stack
    this._runtime.skipPopPostAwait();

    // → add ACG data
    this._runtime.async.preAwait(awaitArgument, resumeContextId, realContextId, preAwaitTid);


    return awaitContextId;
  }

  wrapAwait(programId, awaitValue) {
    // nothing to do
    return awaitValue;
  }


  /**
   * Resume given stack
   */
  postAwait(programId, awaitResult, awaitArgument, realContextId, awaitContextId) {
    // TODO:
    //  * fix`postAwait` not pushing async function context back on shadow stack

    // sanity checks
    // console.trace('postAwait', awaitArgument);
    const awaitContext = executionContextCollection.getById(awaitContextId);
    if (!awaitContext) {
      logTrace('Tried to postAwait, but context was not registered:', awaitContextId);
    }
    else {
      // resume after await → pop Await context
      this._runtime.resumeWaitingStackAndPop(awaitContextId);

      if (Verbose) {
        verboseDebug(
          // ${JSON.stringify(staticContext)}
          `[postAwait]${' '.repeat(this.runtime._executingStack._stack?.length || 0)} Await ${awaitContextId}`
        );
      }

      // add resume context
      // NOTE: staticContext is the same for resume and await
      const { staticContextId: awaitStaticContextId } = awaitContext;
      const awaitStaticContext = staticContextCollection.getById(awaitStaticContextId);
      const { resumeId: resumeStaticContextId } = awaitStaticContext;

      // pushResume
      // NOTE: `tid` is a separate instruction, following `postAwait`
      const resumeInProgramStaticTraceId = 0;
      const resumeContextId = this.pushResume(programId, realContextId, ExecutionContextType.ResumeAsync, resumeStaticContextId, resumeInProgramStaticTraceId);

      this._runtime._updateVirtualRootContext(resumeContextId);

      // debug(awaitArgument, 'is awaited at context', awaitContextId);

      // const { parentContextId: realContextId } = executionContextCollection.getById(resumeContextId);
      const postEventContextId = resumeContextId;

      // register thread logic
      this._runtime.async.postAwait(/* awaitContextId, */ realContextId, postEventContextId, awaitArgument);
    }
  }

  /**
   * @return {number} resumeContextId
   */
  pushResume(programId, realContextId, contextType, inProgramResumeStaticContextId, resumeInProgramStaticTraceId = 0/* , dontTrace = false */, definitionTid = 0) {
    this._runtime.beforePush(null);

    const stackDepth = this._runtime.getStackDepth();
    const runId = this._runtime.getCurrentRunId();
    const parentContextId = this._runtime.peekCurrentContextId();

    const parentTraceId = this._runtime.getParentTraceId();

    // add resumeContext
    const schedulerTraceId = null;
    const resumeContext = executionContextCollection.pushResume(
      contextType,
      stackDepth, runId, realContextId, parentContextId, parentTraceId, programId, inProgramResumeStaticContextId, schedulerTraceId,
      definitionTid
    );
    if (!realContextId) {
      // hackfix: this is first push of interruptable function
      resumeContext.realContextId = resumeContext.contextId;
    }
    if (!contextType) {
      // look up context type
      // NOTE: do this with actual staticContextId
      const staticContext = staticContextCollection.getById(resumeContext.staticContextId);
      ({ type: contextType } = staticContext);
      resumeContext.contextType = contextType;
      if (!isResumeType(contextType)) {
        warn(`incorrect pushResume - contextType is not Resume in: "${executionContextCollection.makeContextInfo(resumeContext)}"`);
      }
    }

    const { contextId: resumeContextId } = resumeContext;
    this._runtime.push(resumeContextId);

    if (resumeInProgramStaticTraceId) {
      // add "push" trace after context!
      this.newTraceId(programId, resumeInProgramStaticTraceId);
      // this._trace(programId, resumeContextId, runId, inProgramStaticTraceId, TraceType.Resume);
    }

    if (Verbose) {
      // const staticContext = staticContextCollection.getContext(programId, resumeStaticContextId);
      debug(
        // ${JSON.stringify(staticContext)}
        // eslint-disable-next-line max-len
        `> ${' '.repeat(this.runtime._executingStack._stack?.length || 0)} (Resume) ${executionContextCollection.makeContextInfo(resumeContextId)} (pid=${programId}, realCid=${realContextId}, pcid=${parentContextId})`
      );
      this.debugOnContextAdd(resumeContext);
    }
    return resumeContextId;
  }

  // popResumeTop() {
  //   const resumeContextId = this._runtime.peekCurrentContextId();
  //   return this.popResume(resumeContextId);
  // }


  popResume(resumeContextId = 0) {
    // sanity checks
    if (!resumeContextId) {
      // Case 1: an error was thrown in a nested `async` function call (should be fixed)
      //    → as a result the calling `async` function would not have had a chance to `pushResume` before hitting `finally` → `popResume`
      // Case 2: async function called from object getter?
      // logTrace('Tried to popResume, but cid was 0. Is this an async function that started in an object getter?');
      return;
    }

    if (Verbose) {
      verboseDebug(
        // ${JSON.stringify(staticContext)}
        `<${' '.repeat(this.runtime._executingStack._stack?.length || 0)}${executionContextCollection.makeContextInfo(resumeContextId)}`
      );
    }

    // sanity checks
    // resumeContextId = resumeContextId || this._runtime.peekCurrentContextId();
    const context = executionContextCollection.getById(resumeContextId);
    if (!context) {
      logTrace(`Tried to popResume, but context was not registered - resumeContextId=${resumeContextId}`);
      return;
    }
    if (!isResumeType(context.contextType)) {
      logTrace(
        `Tried to popResume, but stack top is not of type "Resume" -`,
        `\n  Context: ${executionContextCollection.makeContextInfo(context)}`,
        `\n----\n  Stack: ${this.runtime._executingStack?.humanReadableString()}\n\n`
      );
      return;
    }

    this._pop(resumeContextId);
  }

  getLastExecutionContextId() {
    const lastExecutionContext = executionContextCollection.getLast();
    return lastExecutionContext.contextId;
  }

  updateExecutionContextPromiseId(contextId, promiseId) {
    // debug('update execution context promise id', contextId, promiseId);

    // [edit-after-send]
    executionContextCollection.getById(contextId).promiseId = promiseId;
  }

  isValidContext() {
    return !!this._runtime._executingStack?.length;
  }

  /** ###########################################################################
   * generator functions
   *  #########################################################################*/

  preYield(programId, yieldArgument, schedulerTid) {
    const resumeContextId = this._runtime.peekCurrentContextId();
    // const context = executionContextCollection.getById(resumeContextId);
    // const { staticContextId } = context;

    // // get generator function context
    // const { parentId: generatorStaticContextId } = staticContextCollection.getById(staticContextId);
    // const { staticContextId: parentStaticContextId } = executionContextCollection.getById(parentContextId);

    // → pop Resume context
    this.popResume(resumeContextId);

    // if (parentStaticContextId === generatorStaticContextId) {
    //   // considerations:
    //   //    → generator + async modifiers need to play well with one another, so we they should work mostly very similarly

    //   // also pop generator function context on first yield
    //   // this.popFunction(programId, parentContextId, TODO);
    // }

    return yieldArgument;
  }

  postYield(programId, realContextId, yieldResult, yieldArgument, inProgramResumeStaticContextId) {
    // // resume after yield
    // if (Verbose) {
    //   debug(
    //     // ${JSON.stringify(staticContext)}
    //     `>${' '.repeat(this.runtime._executingStack._stack?.length || 0)} Yield ${staticResumeContextId}`
    //   );
    // }

    // pushResume
    // NOTE: `tid` is a separate instruction, following `postYield`
    const resumeInProgramStaticTraceId = 0;
    /* const resumeContextId = */
    this.pushResume(programId, realContextId, ExecutionContextType.ResumeGen, inProgramResumeStaticContextId, resumeInProgramStaticTraceId);
  }

  /** ###########################################################################
   * debugging
   *  #########################################################################*/

  /**
   * Record stack data with context object for debugging purpose.
   * 
   * @param {ExecutionContext} context 
   */
  debugOnContextAdd(context) {
    // warn('[PUSH]', ' '.repeat(this.runtime._executingStack._stack?.length || 0), executionContextCollection.makeContextInfo(context));
    executionContextCollection.debugAddContextDebugData(context, {
      stack: this.runtime._executingStack?.humanReadable()
    });
  }

  // ###########################################################################
  // traces
  // ###########################################################################

  _ensureExecuting() {
    if (!this._runtime._executingStack) {
      // eslint-disable-next-line no-console
      console.trace('Encountered trace when stack is empty');
      return false;
    }
    return true;
  }

  logFail(msg) {
    logError(new Error(msg).stack);
  }

  // ###########################################################################
  // traces
  // ###########################################################################

  trace(programId, inProgramStaticTraceId) {
    if (!this._ensureExecuting()) {
      return;
    }
    // const contextId = this._runtime.peekCurrentContextId();
    // const runId = this._runtime.getCurrentRunId();
    // this._trace(programId, contextId, runId, inProgramStaticTraceId);
    this.newTraceId(programId, inProgramStaticTraceId);
  }

  newTraceId = (programId, inProgramStaticTraceId) => {
    if (!this._ensureExecuting()) {
      const staticTraceId = staticTraceCollection.getStaticTraceId(programId, inProgramStaticTraceId);
      logTrace('  (not executing)', traceCollection.makeStaticTraceInfo(staticTraceId, true));
      return -1;
    }

    const contextId = this._runtime.peekCurrentContextId();
    const runId = this._runtime.getCurrentRunId();
    const rootContextId = this._runtime.getCurrentVirtualRootContextId();
    const overrideType = null;

    const trace = traceCollection.trace(programId, contextId, rootContextId, runId, inProgramStaticTraceId, overrideType);
    this._onTrace(contextId, trace);

    return trace.traceId;
  }

  traceDeclaration = (programId, inProgramStaticTraceId, value = undefined, inputs = undefined) => {
    if (!this._ensureExecuting()) {
      return -1;
    }

    const traceId = this.newTraceId(programId, inProgramStaticTraceId);

    // this.registerTrace(value, tid);
    const varAccess = {
      declarationTid: traceId
    };
    inputs = traceCollection.getDataNodeIdsByTraceIds(traceId, inputs);
    dataNodeCollection.createOwnDataNode(value, traceId, DataNodeType.Write, varAccess, inputs);

    return traceId;
  }

  // ###########################################################################
  // Basics
  // ###########################################################################

  /**
   * @param {DataNodeMeta} valueMeta
   */
  traceExpression(programId, value, tid, inputs, valueMeta = null) {
    if (!this._ensureExecuting()) {
      return value;
    }
    if (!tid) {
      this.logFail(`traceExpression failed to capture tid`);
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
      // const contextId = this._runtime.peekCurrentContextId();
      // const runId = this._runtime.getCurrentRunId();
      // const overrideType = null;

      const varAccess = null;
      inputs = traceCollection.getDataNodeIdsByTraceIds(tid, inputs);
      dataNodeCollection.createOwnDataNode(value, tid, DataNodeType.Read, varAccess, inputs, valueMeta);
      return value;
    }
  }

  traceExpressionVar(programId, value, tid, declarationTid) {
    if (!this._ensureExecuting()) {
      return value;
    }
    if (!tid) {
      this.logFail(`traceExpression failed to capture tid`);
      return value;
    }

    const varAccess = declarationTid && { declarationTid } || null;
    const { dataNode } = getTraceStaticTrace(tid);

    dataNodeCollection.createOwnDataNode(value, tid, DataNodeType.Read, varAccess, null, dataNode);

    return value;
  }

  traceExpressionME(programId, value, propValue, tid, objectTid) {
    if (!this._ensureExecuting()) {
      return value;
    }
    if (!tid) {
      this.logFail(`traceExpressionME failed to capture tid`);
      return value;
    }

    const varAccess = {
      objectNodeId: traceCollection.getOwnDataNodeIdByTraceId(objectTid),
      prop: propValue
    };

    dataNodeCollection.createOwnDataNode(value, tid, DataNodeType.Read, varAccess);
    return value;
  }

  // registerTrace(value, tid) {
  //   const trace = traceCollection.getById(tid);
  // }

  traceWriteVar(programId, value, tid, declarationTid, inputs) {
    if (!this._ensureExecuting()) {
      return value;
    }
    if (!tid) {
      // TODO: also trace ME
      this.logFail(`traceWrite failed to capture tid`);
      return value;
    }

    // this.registerTrace(value, tid);
    const inputsNodeIds = traceCollection.getDataNodeIdsByTraceIds(tid, inputs);
    return this.#addWriteVarDataNodes(value, tid, declarationTid, inputsNodeIds);
  }

  #addWriteVarDataNodes(value, tid, declarationTid, inputsNodeIds) {
    // [future-work] `declarationTid` should always have a declaration.
    //    If not, we did not record its declaration. E.g. for global built-ins.
    if (!declarationTid) {
      declarationTid = tid;
    }
    // console.warn('twv', tid, declarationTid);
    const varAccess = declarationTid && { declarationTid };
    dataNodeCollection.createOwnDataNode(value, tid, DataNodeType.Write, varAccess, inputsNodeIds);
    return value;
  }

  traceWriteME(programId, objectTid, propValue, propTid, value, tid, inputTids) {
    if (!this._ensureExecuting()) {
      return value;
    }
    if (!tid) {
      this.logFail(`traceWriteME failed to capture tid`);
      return value;
    }

    const objectNodeId = traceCollection.getOwnDataNodeIdByTraceId(objectTid);
    const inputs = traceCollection.getDataNodeIdsByTraceIds(tid, inputTids);
    return this.#addWriteMEDataNodes(value, objectNodeId, propValue, propTid, tid, inputs);
  }

  #addWriteMEDataNodes(value, objectNodeId, propValue, propTid, tid, inputs) {
    // this.registerTrace(value, tid);
    if (isFunction(propValue)) {
      // sanity check
      // NOTE: this is often caused by missing cache flushing *yargs*
      debugger;
      const trace = traceCollection.getById(tid);
      const propTrace = propTid && traceCollection.getById(propTid);
      const objectDataNode = dataNodeCollection.getById(objectNodeId);
      // eslint-disable-next-line max-len
      throw new Error(`invalid prop at #${trace?.staticTraceId || '?'} (#${propTrace?.staticTraceId || '?'}) - must not be function: ${propValue.name || propValue}\n   value=${value}\n   object=${objectDataNode && dataNode2String(objectDataNode) || `#${objectNodeId}`}`);
    }
    const varAccess = {
      objectNodeId,
      prop: propValue,
      propNodeId: traceCollection.getOwnDataNodeIdByTraceId(propTid)
    };
    dataNodeCollection.createOwnDataNode(value, tid, DataNodeType.Write, varAccess, inputs);
    return value;
  }

  // TODO: propTid
  traceDeleteME(programId, result, propValue, tid, objectTid) {
    if (!this._ensureExecuting()) {
      return result;
    }

    // this.registerTrace(value, tid);
    const varAccess = {
      objectNodeId: traceCollection.getOwnDataNodeIdByTraceId(objectTid),
      prop: propValue
    };
    dataNodeCollection.createOwnDataNode(undefined, tid, DataNodeType.Delete, varAccess);
    return result;
  }

  // ###########################################################################
  // Class
  // ###########################################################################

  traceClass(programId, value, tid, staticMethods, publicMethods) {
    if (!this._ensureExecuting()) {
      return value;
    }

    // add class node
    const varAccess = {
      declarationTid: tid
    };
    // DataNodeType.Create
    const classNode = dataNodeCollection.createOwnDataNode(value, tid, DataNodeType.Write, varAccess);

    // [runtime-error] runtime value access (but should actually never happen)
    const proto = value.prototype;

    // add prototype node
    const prototypeVarAccess = {
      objectNodeId: classNode.nodeId,
      prop: 'prototype'
    };
    // DataNodeType.Create
    const prototypeNode = dataNodeCollection.createDataNode(proto, tid, DataNodeType.Write, prototypeVarAccess);


    const trace = traceCollection.getById(tid);
    if (trace) {
      // const { staticTraceId } = trace;
      // const { data: {
      //   staticMethods: staticMethodNames,
      //   publicMethods: publicMethodNames
      // } } = staticTraceCollection.getById(staticTraceId);

      // console.warn('traceClass', publicMethodNames, value.prototype[publicMethodNames[0]]);

      // add staticMethod nodes
      for (let i = 0; i < staticMethods.length; ++i) {
        const [methodName, method, methodTid] = staticMethods[i];
        const methodAccess = {
          objectNodeId: classNode.nodeId,
          prop: methodName
        };
        // DataNodeType.Create
        dataNodeCollection.createOwnDataNode(method, methodTid, DataNodeType.Write, methodAccess);
      }

      // add publicMethods nodes to prototype
      for (let i = 0; i < publicMethods.length; i++) {
        const [methodName, methodTid] = publicMethods[i];
        const method = value.prototype[methodName];   // NOTE: public methods can be accessed dynamically
        const methodAccess = {
          objectNodeId: prototypeNode.nodeId,
          prop: methodName
        };
        // DataNodeType.Create
        dataNodeCollection.createOwnDataNode(method, methodTid, DataNodeType.Write, methodAccess);
      }
    }

    return value;
  }

  /**
   * Is called when class gets instantiated w/ `value` == `this`.
   * Instrumented via iife property
   */
  traceInstance(programId, value, tid, privateMethods) {
    if (!this._ensureExecuting()) {
      return value;
    }

    // DataNodeType.Create
    const instanceNode = dataNodeCollection.createOwnDataNode(value, tid, DataNodeType.Write);

    const trace = traceCollection.getById(tid);
    if (trace) {
      const { staticTraceId } = trace;
      const { data: {
        privateMethods: privateMethodNames
      } } = staticTraceCollection.getById(staticTraceId);

      // add privateMethods nodes
      for (let i = 0; i < privateMethodNames.length; ++i) {
        const methodName = privateMethodNames[i];
        const [method, methodTid] = privateMethods[i];
        const methodAccess = {
          objectNodeId: instanceNode.nodeId,
          prop: methodName
        };

        // DataNodeType.Create
        dataNodeCollection.createOwnDataNode(method, methodTid, DataNodeType.Write, methodAccess);
      }
    }

    return value;
  }


  // ###########################################################################
  // UpdateExpression
  // ###########################################################################

  /**
   * This is `i++`, `++o.x` etc.
   */
  _traceUpdateExpression(updateValue, returnValue, readTid, tid, varAccess) {
    // const trace = traceCollection.getById(tid);

    // add write node
    const inputs = [traceCollection.getOwnDataNodeIdByTraceId(readTid)];
    const writeNode = dataNodeCollection.createOwnDataNode(updateValue, tid, DataNodeType.ComputeWrite, varAccess, inputs);

    if (updateValue !== returnValue) {
      // add separate expression value node
      const updateNode = dataNodeCollection.createDataNode(returnValue, tid, DataNodeType.Read, null, inputs);
      // trace.nodeId = updateNode.nodeId;
    }
    // else {
    //   trace.nodeId = writeNode.nodeId;
    // }
    return returnValue;
  }

  traceUpdateExpressionVar(programId, updateValue, returnValue, readTid, tid, declarationTid) {
    if (!this._ensureExecuting()) {
      return returnValue;
    }

    const varAccess = declarationTid && { declarationTid };
    return this._traceUpdateExpression(updateValue, returnValue, readTid, tid, varAccess);
  }

  traceUpdateExpressionME(programId, obj, prop, updateValue, returnValue, readTid, tid, objectTid) {
    if (!this._ensureExecuting()) {
      return returnValue;
    }

    const varAccess = {
      objectNodeId: traceCollection.getOwnDataNodeIdByTraceId(objectTid),
      prop
    };
    return this._traceUpdateExpression(updateValue, returnValue, readTid, tid, varAccess);
  }

  /** ###########################################################################
   * try/catch/finally
   * ##########################################################################*/

  traceCatch(programId, inProgramStaticTraceId) {
    if (!this.areTracesDisabled) {
      this.newTraceId(programId, inProgramStaticTraceId);
    }
  }

  traceCatchInterruptable(programId, inProgramStaticTraceId, realContextId, awaitContextId, inProgramStaticResumeContextId) {
    this._fixContextAsync(programId, realContextId, awaitContextId);
    this._fixContextGen(programId, realContextId, inProgramStaticResumeContextId);
    this.traceCatch(programId, inProgramStaticTraceId);
  }

  traceFinally(programId, inProgramStaticTraceId) {
    if (!this.areTracesDisabled) {
      this.newTraceId(programId, inProgramStaticTraceId);
    }
  }

  traceFinallyInterruptable(programId, inProgramStaticTraceId, realContextId, awaitContextId, inProgramStaticResumeContextId) {
    this._fixContextAsync(programId, realContextId, awaitContextId);
    this._fixContextGen(programId, realContextId, inProgramStaticResumeContextId);
    this.traceFinally(programId, inProgramStaticTraceId);
  }

  // TODO: what about async generator functions?
  //    → IMPORTANT: gen.throw will be queued and will only take effect after its corresponding yield.

  _fixContextAsync(programId, realContextId, awaitContextId) {
    // TODO: make sure that `Program` also gets a `realContextId` (contextIdVar)
    if (realContextId && awaitContextId && this.runtime.isContextWaiting(awaitContextId)) {
      // we are resuming an async context without knowing how we got here.
      // Caused by error thrown asynchronously down the async stack while async function was waiting.
      Verbose > 1 && verboseDebug(`fixContextAsync(${[programId, realContextId, awaitContextId]})`);
      this.postAwait(programId, undefined, undefined, realContextId, awaitContextId);
    }
  }

  _fixContextGen(programId, realContextId, inProgramStaticResumeContextId) {
    if (inProgramStaticResumeContextId && !this.runtime.isStaticContextOnStack(programId, inProgramStaticResumeContextId)) {
      // we are back in generator, but yield context is not on stack yet.
      // Caused by error back-injected into generator when it was not on stack, via `yield * erroneousCall()` or `Generator.throw()`.
      Verbose > 1 && verboseDebug(`fixContextGen(${[programId, realContextId, inProgramStaticResumeContextId]})`);
      this.postYield(programId, realContextId, undefined, undefined, inProgramStaticResumeContextId);
    }
  }

  // _fixContext(programId, realContextId, resumeInProgramStaticTraceId = 0) {
  //   const realContext = executionContextCollection.getById(realContextId);
  //   if (!realContext) {
  //     // sanity check
  //     logTrace('Tried to fixContext, but context was not registered:', realContextId);
  //     return;
  //   }

  //   const parentContextId = this._runtime.peekCurrentContextId();
  //   const parentContext = parentContextId && executionContextCollection.getById(parentContextId);
  //   const realStaticContext = parentContext && staticContextCollection.getById(realContext.staticContextId);
  //   if (parentContext && (
  //     !realStaticContext.isInterruptable ||
  //     isResumeType(parentContext.contextType)
  //   )
  //   ) {
  //     return;
  //   }

  //   // NOTE: only if we are in interruptable function and there is no `Resume` context on the current stack
  //   //    → patch it up

  //   // resume after await failure
  //   this._runtime.resumeWaitingStackReal(realContextId);

  //   if (Verbose) {
  //     debug(`<- FixContext ${realContextId} [${this._runtime._executingStack._stack.join(',')}]`);
  //   }

  //   const awaitContextId = this._runtime.popTop();
  //   const awaitContext = executionContextCollection.getById(awaitContextId);
  //   const { staticContextId: awaitStaticContextId } = awaitContext;
  //   const awaitStaticContext = staticContextCollection.getById(awaitStaticContextId);
  //   const { resumeId: resumeStaticContextId } = awaitStaticContext;

  //   // pushResume
  //   const resumeContextId = this.pushResume(programId, realContextId, contextType, resumeStaticContextId, resumeInProgramStaticTraceId);

  //   this._runtime._updateVirtualRootContext(resumeContextId);

  //   const postEventContextId = resumeContextId;

  //   // register thread logic
  //   const awaitArgument = null;
  //   this._runtime.async.postAwait(/* awaitContextId, */ realContextId, postEventContextId, awaitArgument);
  // }

  // ###########################################################################
  // CallExpression
  // ###########################################################################

  // traceCallee(programId, value, tid, declarationTid) {
  //   this.traceExpression(programId, value, tid, declarationTid);
  //   return value;
  // }

  traceBCE(programId, callId, callee, calleeTid, argTids, args) {
    if (!this._ensureExecuting()) {
      return callee;
    }
    const staticTrace = traceCollection.getStaticTraceByTraceId(callId);
    const argConfigs = staticTrace?.data?.argConfigs;

    const spreadArgs = args?.map((a, i) => {
      // [runtime-error] potential runtime error
      // NOTE: trying to spread a non-iterable results in Error; e.g.:
      //      "Found non-callable @@iterator"
      //      "XX is not iterable"
      return argConfigs?.[i]?.isSpread &&
        Array.from(a); // alternative: _slicedToArray(a)
    }) || EmptyArray;

    const bceTrace = traceCollection.getById(callId);

    // [edit-after-send]
    bceTrace.callId = callId;
    bceTrace.data = {
      calleeTid,
      argTids,
      spreadLengths: spreadArgs.map((a) => a ? a.length : null)
    };

    // [spread]
    for (let i = 0; i < spreadArgs.length; i++) {
      const spreadArg = spreadArgs[i];
      if (!spreadArg) {
        continue;
      }

      const argTid = argTids[i];

      // Add one `DataNode` per spread argument
      for (let j = 0; j < spreadArg.length; j++) {
        const arg = spreadArg[j];

        const varAccess = {
          objectNodeId: traceCollection.getOwnDataNodeIdByTraceId(argTid),
          prop: j
        };
        dataNodeCollection.createDataNode(arg, argTid, DataNodeType.Read, varAccess);
      }
    }

    // console.trace(`BCE`, callee.toString(), callee);

    const overrideCallee = this.callbackPatcher.getPatchedFunctionOrNull(callee);
    if (!overrideCallee) {
      this.callbackPatcher.monkeyPatchArgs(callee, callId, args, spreadArgs, argTids);
    }
    return overrideCallee || callee;
  }

  traceCallResult(programId, value, tid, callId) {
    if (!this._ensureExecuting()) {
      return value;
    }
    const callResultTrace = traceCollection.getById(tid);

    // const bceStaticTrace = traceCollection.getStaticTraceByTraceId(callId);
    // let valueMeta;
    // if (bceStaticTrace.data.specialType) {
    //   // NOTE: taken care of in `ReferencedIdIdentifier`
    //   valueMeta = DataNodeMetaBySpecialIdentifierType[bceStaticTrace.data.specialType];
    // }

    // [edit-after-send]
    callResultTrace.resultCallId = callId;

    this.traceExpression(programId, value, tid, null);

    const contextId = this._runtime.peekCurrentContextId();
    // const runId = this._runtime.getCurrentRunId();
    this._onTrace(contextId, callResultTrace);

    if (!valueCollection.getIsThenable(value)) {
      return value;
    }

    // register promise-valued CallExpression
    this._runtime.async.traceCallPromiseResult(contextId, callResultTrace, value);
    // this._runtime.thread2.recordMaybeNewPromise(value, runId, contextId, calledContextId);

    return value;
  }

  // ###########################################################################
  // {Array,Object}Expression
  // ###########################################################################

  traceArrayExpression(programId, value, spreadLengths, arrTid, argTids) {
    if (!this._ensureExecuting()) {
      return value;
    }

    // DataNodeType.Create
    const ownDataNode = dataNodeCollection.createOwnDataNode(value, arrTid, DataNodeType.Compute, null, null, ShallowValueRefMeta);

    // for each element: add (new) write node which has (original) read node as input
    let idx = 0;
    for (let i = 0; i < argTids.length; i++) {
      const argTid = argTids[i];
      const spreadLen = spreadLengths[i];
      // const targetTid = argTid;
      const targetTid = arrTid;

      if (!argTid) {
        // empty (omitted) array element (e.g.: [1, , 2])
        continue;
      }
      else if (spreadLen >= 0) {
        // [spread]
        for (let j = 0; j < spreadLen; j++) {
          const readAccess = {
            objectNodeId: traceCollection.getOwnDataNodeIdByTraceId(argTid),
            prop: j
          };
          const readNode = dataNodeCollection.createDataNode(value[idx], targetTid, DataNodeType.Read, readAccess);
          const writeAccess = {
            objectNodeId: ownDataNode.nodeId,
            prop: idx
          };
          dataNodeCollection.createWriteNodeFromReadNode(targetTid, readNode, writeAccess);
          ++idx;
        }
      }
      else {
        // not spread
        const varAccess = {
          objectNodeId: ownDataNode.nodeId,
          prop: idx
        };
        dataNodeCollection.createWriteNodeFromTrace(targetTid, argTid, varAccess);
        ++idx;
      }
    }

    return value;
  }

  traceObjectExpression(programId, value, entries, argConfigs, objectTid, propTids) {
    if (!this._ensureExecuting()) {
      return value;
    }

    // DataNodeType.Create
    const objectNode = dataNodeCollection.createOwnDataNode(value, objectTid, DataNodeType.Compute, null, null, ShallowValueRefMeta);
    const objectNodeId = objectNode.nodeId;

    // for each prop: add (new) write node which has (original) read node as input
    for (let i = 0; i < entries.length; i++) {
      const propTid = propTids[i];
      if (!propTid) {
        const traceInfo = traceCollection.makeTraceInfo(objectTid);
        warn(new Error(`Missing propTid #${i} in traceObjectExpression\n  at trace #${objectTid}: ${traceInfo} `));
        continue;
      }
      // const targetTid = propTid;
      const targetTid = objectTid;

      if (argConfigs[i].isSpread) {
        // [spread]
        const nested = entries[i];
        // NOTE: we can use `for in` here, because this is the "spread copy" of the object
        for (const key in nested) {
          const readAccess = {
            objectNodeId: traceCollection.getOwnDataNodeIdByTraceId(propTid),
            prop: key
          };
          const readNode = dataNodeCollection.createDataNode(value[key], targetTid, DataNodeType.Read, readAccess);
          const writeAccess = {
            objectNodeId,
            prop: key
          };
          dataNodeCollection.createWriteNodeFromReadNode(targetTid, readNode, writeAccess);
        }
      }
      else {
        // not spread
        const [key] = entries[i];
        const varAccess = {
          objectNodeId,
          prop: key
        };
        dataNodeCollection.createWriteNodeFromTrace(targetTid, propTid, varAccess);
      }
    }

    return value;
  }

  /** ###########################################################################
   * Patterns
   * ##########################################################################*/

  /**
   * NOTE: Pattern trace is attached to its rval.
   * 
   * TODO: default values (see DefaultInitializerIndicator)
   * 
   * @param {*} programId 
   * @param {*} rval 
   * @param {*} rvalTid 
   * @param {*} treeNodes 
   */
  tracePattern(programId, rval, tid, rvalTid, treeNodes) {
    if (!this._ensureExecuting()) {
      return rval;
    }

    // const rvalStaticTrace = traceCollection.getStaticTraceByTraceId(rvalTid);
    // const { tree } = rvalStaticTrace.data;

    const root = treeNodes[0];
    const rvalDataNodeId = traceCollection.getOwnDataNodeIdByTraceId(rvalTid);
    // const varAccess = null;
    // const inputs = [rvalDataNodeId];
    // const rvalDataNode = dataNodeCollection.createOwnDataNode(rval, rvalTid, DataNodeType.Read, varAccess, inputs);
    return this._tracePatternHandlers[root.type](treeNodes, root, rval, rvalTid, rvalDataNodeId);
  }

  _getPatternProp(obj, prop) {
    // [runtime-error] runtime value access
    if (!obj) {
      // value does not exist (or is primitive) → cause standard error message (if necessary)
      return obj[prop];
    }
    return valueCollection._readProperty(obj, prop);
  }

  _tracePatternRecurse = (nodes, node, childValues, value, rvalTid, readDataNodeId, result) => {
    const { children } = node;

    // NOTE: we do two passes, to make sure, `DataNode`s of consecutive `nodeId`s don't jump between traces

    // TODO: need to do two completely independent passes: 
    //    1. build the result/Read-DataNode tree
    //    2. traverse the tree
    

    for (const iChild of children) {
      const childNode = nodes[iChild];
      this._tracePatternChild(nodes, childNode, childValues, rvalTid, readDataNodeId, result);
    }
    // // 1. Groups (all reads)
    // for (const iChild of children) {
    //   const childNode = nodes[iChild];
    //   if (isGroupPattern(childNode.type)) {
    //     this._tracePatternChild(nodes, childNode, childValues, rvalTid, readDataNodeId, result);
    //   }
    // }
    // // 2. Values (reads + writes)
    // for (const iChild of children) {
    //   const childNode = nodes[iChild];
    //   if (!isGroupPattern(childNode.type)) {
    //     this._tracePatternChild(nodes, childNode, childValues, rvalTid, readDataNodeId, result);
    //   }
    // }

    VerbosePatterns > 1 && debug(`[Pattern] Result ${PatternAstNodeType.nameFrom(node.type)} at ${node.prop}:`, result);
    return result;
  }

  _tracePatternChild(nodes, childNode, childValues, rvalTid, readDataNodeId, result) {
    const { type, prop } = childNode;

    const childValue = this._getPatternProp(childValues, prop);
    // eslint-disable-next-line max-len
    VerbosePatterns && debug(
      `[Pattern] ${PatternAstNodeType.nameFrom(childNode.type)}: ` +
      `${JSON.stringify(omit(childNode, ['type']))}\n  ` +
      `value=${childValue} (${typeof childValue})`
    );

    let varAccess;
    let inputs;
    // if (defaultValueTid) {// NOTE: we cannot get access to `defaultValueTid`
    //   // input from default value
    //   inputs = [traceCollection.getOwnDataNodeIdByTraceId(defaultValueTid)];
    // }
    // else {
    // read from rval
    varAccess = {
      objectNodeId: readDataNodeId,
      prop: prop
    };
    // }
    // const inputs = [parentReadDataNodeId];
    const childReadDataNodeId = dataNodeCollection.createDataNode(
      childValue, rvalTid, DataNodeType.Read, varAccess, inputs
    ).nodeId;

    if (childValue === undefined && !valueCollection._readIsPropertyInObject(childValues, prop)) {
      result = null;
    }

    try {
      this._tracePatternHandlers[type](
        nodes, childNode, childValue, rvalTid, childReadDataNodeId, result
      );
    }
    catch (err) {
      throw new NestedError(`tracePatternHandler failed for node: ${JSON.stringify(childNode)}`, err);
    }
  }

  _tracePatternHandlers = {
    [PatternAstNodeType.Array]: (nodes, node, value, rvalTid, readDataNodeId, parentResult) => {
      const result = []; // NOTE: we need to reconstruct rval, so rval props are not accessed twice
      // NOTE: array destructuring can also be used on iterables
      const childValues = _slicedToArray(value, node.children.length);
      this._tracePatternRecurse(nodes, node, childValues, value, rvalTid, readDataNodeId, result);
      if (parentResult) {
        parentResult[node.prop] = result;
      }
      return result;
    },
    [PatternAstNodeType.Object]: (nodes, node, value, rvalTid, readDataNodeId, parentResult) => {
      const result = {}; // NOTE: we need to reconstruct rval, so rval props are not accessed twice
      // NOTE: object destructuring just reads props as-is
      const childValues = value;
      this._tracePatternRecurse(nodes, node, childValues, value, rvalTid, readDataNodeId, result);
      if (parentResult) {
        parentResult[node.prop] = result;
      }
      return result;
    },
    [PatternAstNodeType.Var]: (nodes, node, value, rvalTid, readDataNodeId, parentResult) => {
      let { tid, declarationTid } = node;
      const inputs = [readDataNodeId];
      // TODO: declarationTid might be 0, because in non-strict mode, we might assign to non-declared vars.
      //    → We need to fix `getOwnDeclarationNode` for this
      // declarationTid ||= tid;
      const res = this.#addWriteVarDataNodes(value, tid, declarationTid, inputs);
      if (parentResult) {
        parentResult[node.prop] = res;
      }
    },
    [PatternAstNodeType.ME]: (nodes, node, value, rvalTid, readDataNodeId, parentResult) => {
      const { tid, objectTid, propValue, propTid } = node;
      const inputs = [readDataNodeId];
      const objectNodeId = traceCollection.getOwnDataNodeIdByTraceId(objectTid);
      const res = this.#addWriteMEDataNodes(value, objectNodeId, propValue, propTid, tid, inputs);
      if (parentResult) {
        parentResult[node.prop] = res;
      }
    },


    // [rest]
    [PatternAstNodeType.RestArray]: (nodes, node, value, rvalTid, readDataNodeId, parentResult) => {
      const { tid, innerType, startIndex } = node;
      const result = [];
      this._tracePatternHandlers[innerType](nodes, node, result, rvalTid, readDataNodeId);
      const resultObjectNodeId = traceCollection.getOwnDataNodeIdByTraceId(tid);

      for (let iRead = startIndex; iRead < value.length; iRead++) {
        const iWrite = iRead - startIndex;
        let val = result[iWrite] = this._getPatternProp(value, iRead);
        parentResult[iRead] = val;

        const readAccess = {
          objectNodeId: readDataNodeId,
          prop: iRead
        };
        const readNode = dataNodeCollection.createDataNode(val, tid, DataNodeType.Read, readAccess);
        const writeAccess = {
          objectNodeId: resultObjectNodeId,
          prop: iWrite
        };
        dataNodeCollection.createWriteNodeFromReadNode(tid, readNode, writeAccess);
      }
    },

    [PatternAstNodeType.RestObject]: (nodes, node, value, rvalTid, readDataNodeId, parentResult) => {
      const { tid, innerType, excluded } = node;
      const result = {};
      this._tracePatternHandlers[innerType](nodes, node, result, rvalTid, readDataNodeId);
      const resultObjectNodeId = traceCollection.getOwnDataNodeIdByTraceId(tid);

      /**
       * NOTE: this is based on Babel's `_objectWithoutPropertiesLoose`
       */
      const keys = difference(valueCollection.readKeys(value), excluded);
      for (const prop of keys) {
        let val = result[prop] = this._getPatternProp(value, prop);
        parentResult[prop] = val;

        const readAccess = {
          objectNodeId: readDataNodeId,
          prop
        };
        const readNode = dataNodeCollection.createDataNode(val, tid, DataNodeType.Read, readAccess);
        const writeAccess = {
          objectNodeId: resultObjectNodeId,
          prop
        };
        dataNodeCollection.createWriteNodeFromReadNode(tid, readNode, writeAccess);
      }
    }
  };

  /** ###########################################################################
   * purpose
   *  #########################################################################*/

  addPurpose(programId, value, tid, purpose, arg) {
    if (!this._ensureExecuting()) {
      return value;
    }
    const trace = traceCollection.getById(tid);
    if (!trace) {
      throw new Error(`addPurpose failed - trace does not exist (tid="${tid}")`);
    }

    // [edit-after-send]
    addPurpose(trace, {
      type: purpose,
      arg
    });

    return value;
  }

  // // ###########################################################################
  // // Loops (unfinished)
  // // ###########################################################################

  // traceForIn(programId, value, tid, declarationTid, inProgramStaticTraceId) {
  //   if (!this._ensureExecuting()) {
  //     return value;
  //   }
  //   if (!tid) {
  //     this.logFail(`traceForIn failed to capture tid`);
  //     return value;
  //   }

  //   if (!declarationTid) {
  //     declarationTid = tid;
  //   }

  //   // TODO: varAccess is not always have `declarationTid` (might also be object accessor etc.)
  //   const varAccess = declarationTid && { declarationTid };

  //   // create iterator which logs `DataNode` on key access
  //   const pd = { enumerable: true, configurable: true };
  //   return new Proxy(value, {
  //     /**
  //      * NOTE: `getOwnPropertyDescriptor` is called every iteration, while
  //      *   the entire array returned from `ownKeys` is read at the beginning of the loop.
  //      */
  //     getOwnPropertyDescriptor: function (target, key) {
  //       debug('gpd', key, target[key]);

  //       const iterationTraceId = this.newTraceId(programId, inProgramStaticTraceId);
  //       dataNodeCollection.createOwnDataNode(key, iterationTraceId, DataNodeType.Write, varAccess);
  //       return pd;
  //     }
  //   });
  // }

  // traceForOf(programId, value, tid, declarationTid, inProgramStaticTraceId) {
  //   if (!this._ensureExecuting()) {
  //     return value;
  //   }
  //   if (!tid) {
  //     this.logFail(`traceForOf failed to capture tid`);
  //     return value;
  //   }

  //   if (!declarationTid) {
  //     declarationTid = tid;
  //   }

  //   const varAccess = declarationTid && { declarationTid };

  //   // create iterator which logs `DataNode` on key access
  //   const pd = { enumerable: true, configurable: true };
  //   return new Proxy(value, {
  //     /**
  //      * NOTE: `getOwnPropertyDescriptor` is called every iteration, while
  //      *   the entire array returned from `ownKeys` is read at the beginning of the loop.
  //      */
  //     getOwnPropertyDescriptor: function (target, key) {
  //       debug('gpd', key, target[key]);

  //       const iterationTraceId = this.newTraceId(programId, inProgramStaticTraceId);
  //       dataNodeCollection.createOwnDataNode(key, iterationTraceId, DataNodeType.Write, varAccess);
  //       return pd;
  //     }
  //   });
  // }

  // ###########################################################################
  // traces (OLD)
  // ###########################################################################

  // traceArg(programId, inProgramStaticTraceId, value) {
  //   // currently behaves exactly the same as traceExpression
  //   return this.traceExpression(programId, inProgramStaticTraceId, value);
  // }


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

  _trace(programId, contextId, runId, inProgramStaticTraceId, traceType = null) {
    const rootContextId = this._runtime.getCurrentVirtualRootContextId();
    const trace = traceCollection.trace(programId, contextId, rootContextId, runId, inProgramStaticTraceId, traceType);

    // if (Verbose > 1) {
    //   const { staticContextId } = context;
    //   const staticContext = staticContextCollection.getById(staticContextId);
    //   debug(
    //     // ${JSON.stringify(staticContext)}
    //     `  t ${trace.traceId} ${staticContext?.displayName} (${runId}))`
    //   );
    // }

    const { staticTraceId } = trace;
    const { type: staticTraceType } = staticTraceCollection.getById(staticTraceId);
    this._onTrace(contextId, trace, staticTraceType);
    if (isPopTrace(staticTraceType)) {
      trace.previousTrace = this._runtime.getLastTraceInContext(contextId);
    }
    return trace;
  }

  /**
   * @param {Trace} trace 
   */
  _onTrace(contextId, trace, staticTraceType = undefined) {
    if (!staticTraceType) {
      const { staticTraceId } = trace;
      ({ type: staticTraceType } = staticTraceCollection.getById(staticTraceId));
    }

    if (isPopTrace(staticTraceType)) {
      // NOTE: `Pop` cannot be "last trace of a context" (i.e. "last trace" is the one before `Pop`)
      trace.previousTrace = this._runtime.getLastTraceInContext(contextId);
      return;
    }

    const { traceId } = trace;
    if (isBeforeCallExpression(staticTraceType)) {
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
  //     realContextId,
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

  busy = 0;
  tracesDisabled = 0;

  get areTracesDisabled() {
    return !!this.busy || !!this.tracesDisabled;
  }

  get valuesDisabled() {
    return valueCollection.valuesDisabled;
  }

  set valuesDisabled(val) {
    valueCollection.valuesDisabled = val;
  }

  get valuesShallow() {
    return valueCollection.valuesShallow;
  }

  set valuesShallow(val) {
    valueCollection.valuesShallow = val;
  }

  incBusy() {
    ++this.busy;
    ++this.tracesDisabled;
  }

  decBusy() {
    --this.busy;
    --this.tracesDisabled;
  }

  incTracesDisabled() {
    ++this.tracesDisabled;
  }

  decTracesDisabled() {
    --this.tracesDisabled;
  }
}