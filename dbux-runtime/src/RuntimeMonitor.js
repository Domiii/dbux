import { newLogger } from '@dbux/common/src/log/logger';
import ExecutionContextType from '@dbux/common/src/core/constants/ExecutionContextType';
import TraceType, { isBeforeCallExpression, isPopTrace } from '@dbux/common/src/core/constants/TraceType';
// import SpecialIdentifierType from '@dbux/common/src/core/constants/SpecialIdentifierType';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
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

const Verbose = 0;
// const Verbose = 1;
// const Verbose = 2;

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


    Verbose && debug(`addProgram ${programId}: ${programData.fileName} (tracesDisabled=${runtimeCfg.tracesDisabled})`);

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
  // context + function traces
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

    this.newTraceId(programId, inProgramStaticTraceId);

    // this._trace(programId, contextId, runId, inProgramStaticTraceId);

    return contextId;
  }

  registerParams(programId, paramTids) {
    // nothing to do (for now)
  }

  traceReturn(programId, value, tid, inputs) {
    // for now: same as `te`
    return this.traceExpression(programId, value, tid, inputs);
  }

  traceThrow(programId, value, tid, inputs) {
    // for now: same as `te`
    return this.traceExpression(programId, value, tid, inputs);
  }


  popFunction(contextId, inProgramStaticTraceId) {
    // this.checkErrorOnFunctionExit(contextId, inProgramStaticTraceId);
    return this.popImmediate(contextId, inProgramStaticTraceId);
  }

  popTry() {
    // TODO
  }

  popImmediate(contextId, traceId) {
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
    logError(new Error(msg).stack);
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

  traceDeclaration = (programId, inProgramStaticTraceId, value = undefined, inputs = undefined) => {
    if (!this._ensureExecuting()) {
      return -1;
    }

    const traceId = this.newTraceId(programId, inProgramStaticTraceId);

    // this.registerTrace(value, tid);
    const varAccess = {
      declarationTid: traceId
    };
    dataNodeCollection.createOwnDataNode(value, traceId, DataNodeType.Write, varAccess, inputs);

    return traceId;
  }

  traceExpression(programId, value, tid, inputs) {
    if (!this._ensureExecuting()) {
      return value;
    }
    if (!tid) {
      this.logFail(`traceExpression failed to capture tid`);
      return value;
    }

    const varAccess = null;
    inputs = traceCollection.getDataNodeIdsByTraceIds(tid, inputs);
    dataNodeCollection.createOwnDataNode(value, tid, DataNodeType.Read, varAccess, inputs);
    return value;
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
    const trace = traceCollection.getById(tid);
    const { staticTraceId } = trace;
    const { dataNode } = staticTraceCollection.getById(staticTraceId);

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
      objectTid,
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
    // [future-work] `declarationTid` should always be defined. If not, assume global?
    if (!declarationTid) {
      declarationTid = tid;
    }
    const varAccess = declarationTid && { declarationTid };
    dataNodeCollection.createOwnDataNode(value, tid, DataNodeType.Write, varAccess, traceCollection.getDataNodeIdsByTraceIds(tid, inputs));
    return value;
  }

  traceWriteME(programId, value, propValue, tid, objectTid, inputs) {
    if (!this._ensureExecuting()) {
      return value;
    }
    if (!tid) {
      this.logFail(`traceWriteME failed to capture tid`);
      return value;
    }

    // this.registerTrace(value, tid);
    const varAccess = {
      objectTid,
      prop: propValue
    };
    dataNodeCollection.createOwnDataNode(value, tid, DataNodeType.Write, varAccess, traceCollection.getDataNodeIdsByTraceIds(tid, inputs));
    return value;
  }

  _traceUpdateExpression(updateValue, returnValue, readTid, tid, varAccess) {
    const trace = traceCollection.getById(tid);

    // add write node
    const inputs = [traceCollection.getDataNodeIdByTraceId(readTid)];
    const writeNode = dataNodeCollection.createDataNode(updateValue, tid, DataNodeType.Write, varAccess, inputs);

    if (updateValue !== returnValue) {
      // add separate expression value node
      // future work consideration: input to UE is the `Read` node -> somehow missing the missing `1`.
      const updateNode = dataNodeCollection.createDataNode(returnValue, tid, DataNodeType.Read, null, inputs);
      trace.nodeId = updateNode.nodeId;
    }
    else {
      trace.nodeId = writeNode.nodeId;
    }
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
      objectTid,
      prop: prop
    };
    return this._traceUpdateExpression(updateValue, returnValue, readTid, tid, varAccess);
  }

  // traceCallee(programId, value, tid, declarationTid) {
  //   this.traceExpression(programId, value, tid, declarationTid);
  //   return value;
  // }

  traceBCE(programId, tid, argTids, spreadArgs) {
    if (!this._ensureExecuting()) {
      return;
    }

    spreadArgs = spreadArgs.map(a => {
      // [runtime-error] potential runtime error
      // NOTE: trying to spread a non-iterator results in Error anyway; e.g.:
      //      "Found non-callable @@iterator"
      //      "XX is not iterable"
      return a && Array.from(a);
    });

    const trace = traceCollection.getById(tid);
    trace.callId = tid;
    trace.data = {
      argTids,
      spreadLengths: spreadArgs.map(a => a && a.length || null)
    };

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
          objectTid: argTid,
          prop: j
        };
        // [spread]
        dataNodeCollection.createDataNode(arg, argTid, DataNodeType.Read, varAccess);
      }
    }
  }

  traceCallResult(programId, value, tid, callTid) {
    if (!this._ensureExecuting()) {
      return value;
    }
    const trace = traceCollection.getById(tid);
    trace.resultCallId = callTid;
    this.traceExpression(programId, value, tid, 0);
    return value;
  }

  traceArrayExpression(programId, value, spreadLengths, arrTid, argTids) {
    if (!this._ensureExecuting()) {
      return value;
    }
    dataNodeCollection.createOwnDataNode(value, arrTid, DataNodeType.Read);

    // for each element: add (new) write node which has (original) read node as input
    let idx = 0;
    for (let i = 0; i < argTids.length; i++) {
      const argTid = argTids[i];
      const len = spreadLengths[i];

      if (len >= 0) {
        // [spread]
        for (let j = 0; j < len; j++) {
          const readAccess = {
            objectTid: argTid,
            prop: j
          };
          const readNode = dataNodeCollection.createDataNode(value[idx], argTid, DataNodeType.Read, readAccess);
          const writeAccess = {
            objectTid: arrTid,
            prop: idx
          };
          dataNodeCollection.createWriteNodeFromReadNode(argTid, readNode, writeAccess);
          ++idx;
        }
      }
      else {
        // not spread
        const varAccess = {
          objectTid: arrTid,
          prop: i
        };
        dataNodeCollection.createWriteNodeFromTrace(argTid, varAccess);
        ++idx;
      }
    }

    return value;
  }

  traceObjectExpression(programId, value, entries, argConfigs, objectTid, propTids) {
    if (!this._ensureExecuting()) {
      return value;
    }
    dataNodeCollection.createOwnDataNode(value, objectTid, DataNodeType.Read);

    // for each prop: add (new) write node which has (original) read node as input
    for (let i = 0; i < entries.length; i++) {
      const propTid = propTids[i];
      if (!propTid) {
        const traceInfo = traceCollection.makeTraceInfo(objectTid);
        warn(new Error(`Missing propTid #${i} in traceObjectExpression\n  at trace #${objectTid}: ${traceInfo} `));
        continue;
      }

      if (argConfigs[i].isSpread) {
        // [spread]
        const nested = entries[i];
        // NOTE: we can use `for in` here, because this is the "spread copy" of the object
        for (const key in nested) {
          const readAccess = {
            objectTid: propTid,
            prop: key
          };
          const readNode = dataNodeCollection.createDataNode(value[key], propTid, DataNodeType.Read, readAccess);
          const writeAccess = {
            objectTid: objectTid,
            prop: key
          };
          dataNodeCollection.createWriteNodeFromReadNode(propTid, readNode, writeAccess);
        }
      }
      else {
        // not spread
        const [key] = entries[i];
        const varAccess = {
          objectTid: objectTid,
          prop: key
        };
        dataNodeCollection.createWriteNodeFromTrace(propTid, varAccess);
      }
    }

    return value;
  }

  traceUpdateExpression(programId, value, tid, inputs) {
    if (!this._ensureExecuting()) {
      return value;
    }

    const [inputTraceId] = inputs;

    // add `Write` `DataNode` to update the argument's `varAccess`.
    dataNodeCollection.createWriteNodeFromInputTrace(inputTraceId, tid);

    return value;
  }

  traceForIn(programId, value, tid, declarationTid, inProgramStaticTraceId) {
    if (!this._ensureExecuting()) {
      return value;
    }
    if (!tid) {
      this.logFail(`traceForIn failed to capture tid`);
      return value;
    }

    if (!declarationTid) {
      declarationTid = tid;
    }

    const varAccess = declarationTid && { declarationTid };

    // create iterator which logs `DataNode` on key access
    const pd = { enumerable: true, configurable: true };
    return new Proxy(value, {
      /**
       * NOTE: for some reason, `getOwnPropertyDescriptor` is called every iteration, while
       *   the entire array returned from `ownKeys` is read at the beginning of the loop.
       */
      getOwnPropertyDescriptor: function (target, key) {
        console.debug('gpd', key, target[key]);

        const iterationTraceId = this.newTraceId(programId, inProgramStaticTraceId);
        dataNodeCollection.createOwnDataNode(key, iterationTraceId, DataNodeType.Write, varAccess);
        return pd;
      }
    });
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

  _trace(programId, contextId, runId, inProgramStaticTraceId, traceType = null) {
    const trace = traceCollection.trace(programId, contextId, runId, inProgramStaticTraceId, traceType);

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

  _onTrace(contextId, trace, staticTraceType = undefined) {
    if (!staticTraceType) {
      const { staticTraceId } = trace;
      ({ type: staticTraceType } = staticTraceCollection.getById(staticTraceId));
    }

    if (isPopTrace(staticTraceType)) {
      // NOTE: we do not want to consider `pop`s as "last trace of a context"
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