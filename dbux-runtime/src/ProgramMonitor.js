import { newLogger } from '@dbux/common/src/log/logger';
// import staticTraceCollection from './data/staticTraceCollection';
import traceCollection from './data/traceCollection';
import { wrapValue } from './data/valueCollection';


/**
 * Comes from the order we execute things in programVisitor
 */
const ProgramStartTraceId = 1;

/**
 * Comes from the order we execute things in programVisitor
 */
const ProgramEndTraceId = 2;

const DefaultInitializerIndicator = {};

/**
 * In Babel-lingo, a "Program" is one *.js file.
 * Thus the ProgramMonitor monitors a single file, 
 * while all ProgramMonitors share a single `RuntimeMonitor`.
 */
export default class ProgramMonitor {
  /**
   * @type {import('@dbux/common/src/types/StaticProgramContext').default}
   */
  _staticProgramContext;

  /**
   * @type {import('./RuntimeMonitor').default}
   */
  _runtimeMonitor;

  constructor(runtimeMonitor, staticProgramContext) {
    const inProgramStaticContextId = 1;
    this._runtimeMonitor = runtimeMonitor;
    this._staticProgramContext = staticProgramContext;
    this._programContextId = this.pushImmediate(inProgramStaticContextId, ProgramStartTraceId, 0, false);
    this._logger = newLogger(staticProgramContext.filePath);

    // this._logger.debug(`Started tracing program...`);
  }

  /**
   * NOTE - A program has 3 kinds of ids:
   * 1. programId (assigned by `staticProgramContextCollection`; you usually want to use this one)
   * 2. inProgramStaticContextId (assigned by instrumentation; currently always equal to 1)
   * 3. programContextId (assigned by `executionContextCollection`; globally unique across contexts)
   */
  getProgramId() {
    return this._staticProgramContext.programId;
  }

  getProgramContextId() {
    return this._programContextId;
  }

  // ###########################################################################
  // utilities
  // ###########################################################################

  getArgLength = (arg) => {
    return arg?.length;
  }

  arrayFrom = (arg) => {
    // TODO: see Scope.toArray(node, i, arrayLikeIsIterable)
    /**
     * NOTE: Babel does it more carefully:
     * ```js
     * function _iterableToArray(iter) {
     *   if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
     * }
     * ```
     */
    return Array.from(arg);
  }

  /**
   * NOTE: must discern between different numerical types
   * @see https://tc39.es/ecma262/#sec-postfix-increment-operator-runtime-semantics-evaluation
   * @see https://tc39.es/ecma262/#sec-numeric-types
   * @see https://stackoverflow.com/questions/57996921/why-bigint-demand-explicit-conversion-from-number?noredirect=1&lq=1
   */
  unitOfType = (n) => {
    return n?.constructor === BigInt ? 1n : 1;
  }

  /**
   * NOTE: We use this to dynamically determine whether a parameter was not provided,
   * and thus should be assigned its default value.
   */
  get DefaultInitializerIndicator() {
    return DefaultInitializerIndicator;
  }


  // ###########################################################################
  // context management
  // ###########################################################################

  pushImmediate = (inProgramStaticContextId, inProgramStaticTraceId, definitionTid, isInterruptable) => {
    if (this.disabled) {
      return 0;
    }

    const tracesDisabled = this.areTracesDisabled;
    return this._runtimeMonitor.pushImmediate(
      this.getProgramId(),
      inProgramStaticContextId,
      inProgramStaticTraceId,
      definitionTid,
      isInterruptable,
      tracesDisabled
    );
  }

  registerParams = (paramTids) => {
    if (this.areTracesDisabled) {
      return;
    }

    this._runtimeMonitor.registerParams(
      this.getProgramId(),
      paramTids
    );
  }

  traceReturn = (value, tid, inputs) => {
    if (this.areTracesDisabled) {
      return value;
    }

    this._runtimeMonitor.traceReturn(this.getProgramId(), value, tid, inputs);
    return value;
  }

  traceReturnAsync = (value, tid, inputs) => {
    if (this.areTracesDisabled) {
      return value;
    }

    this._runtimeMonitor.traceReturnAsync(this.getProgramId(), value, tid, inputs);
    return value;
  }

  traceThrow = (value, tid, inputs) => {
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceThrow(this.getProgramId(), value, tid, inputs);
  }

  popFunction = (contextId, inProgramStaticTraceId, awaitContextId) => {
    if (this.disabled) {
      return undefined;
    }

    return this._runtimeMonitor.popFunction(this.getProgramId(), contextId, inProgramStaticTraceId, awaitContextId);
  }

  popProgram = () => {
    // finished initializing the program
    if (this.disabled) {
      return undefined;
    }

    return this._runtimeMonitor.popImmediate(this.getProgramId(), this._programContextId, ProgramEndTraceId);
  }

  // ###########################################################################
  // await/async
  // ###########################################################################

  // CallbackArgument(inProgramStaticContextId, schedulerId, traceId, cb) {
  //   return this._runtimeMonitor.CallbackArgument(this.getProgramId(), 
  //     inProgramStaticContextId, schedulerId, traceId, cb);
  // }

  wrapAwait = (awaitValue/*, awaitContextId */) => {
    // nothing to do
    return this._runtimeMonitor.wrapAwait(this.getProgramId(), awaitValue);
  }

  preAwait = (inProgramStaticContextId, traceId, awaitArgument) => {
    if (this.disabled) {
      // TODO: calling asynchronous methods when disabled hints at non-pure getters and will most likely cause trouble :(
      this._logger.error(`Encountered await in disabled call #${traceId} (NOTE: dbux does not play well with impure getters, especially if tey  call asynchronous code)`);
      return 0;
    }
    return this._runtimeMonitor.preAwait(this.getProgramId(), inProgramStaticContextId, traceId, awaitArgument);
  }

  postAwait = (awaitResult, awaitArgument, awaitContextId, resumeTraceId) => {
    // this._logger.debug('await argument is', awaitArgument);
    return this._runtimeMonitor.postAwait(this.getProgramId(), awaitResult, awaitArgument, awaitContextId, resumeTraceId);
  }

  pushResume = (resumeStaticContextId, inProgramStaticTraceId) => {
    return this._runtimeMonitor.pushResume(this.getProgramId(), resumeStaticContextId, inProgramStaticTraceId, true);
  }

  popResume = (resumeContextId) => {
    return this._runtimeMonitor.popResume(resumeContextId);
  }

  // ###########################################################################
  // traces
  // ###########################################################################

  newTraceId = (inProgramStaticTraceId, force = false) => {
    if (this.areTracesDisabled && !force) {
      return -1;
    }
    return this._runtimeMonitor.newTraceId(this.getProgramId(), inProgramStaticTraceId);
  }

  /**
   * 
   */
  traceDeclaration = (inProgramStaticTraceId, value = undefined, inputs = undefined) => {
    value = wrapValue(value);
    if (this.areTracesDisabled) {
      return -1;
    }

    return this._runtimeMonitor.traceDeclaration(this.getProgramId(), inProgramStaticTraceId, value, inputs);
  }

  traceClass = (value, tid, staticMethods, publicMethods) => {
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceClass(this.getProgramId(), value, tid, staticMethods, publicMethods);
  }

  traceInstance = (value, tid, privateMethods) => {
    if (this.areTracesDisabled) {
      return;
    }

    this._runtimeMonitor.traceInstance(this.getProgramId(), value, tid, privateMethods);
  }

  traceExpression = (value, tid, inputs) => {
    value = wrapValue(value);
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceExpression(this.getProgramId(), value, tid, inputs);
  }

  traceExpressionVar = (value, tid, declarationTid) => {
    value = wrapValue(value);
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceExpressionVar(this.getProgramId(), value, tid, declarationTid);
  }

  traceExpressionME = (objValue, propValue, value, tid, objectTid) => {
    value = wrapValue(value);
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceExpressionME(this.getProgramId(), value, propValue, tid, objectTid);
  }

  traceWriteVar = (value, tid, declarationTid, inputs) => {
    value = wrapValue(value);
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceWriteVar(this.getProgramId(), value, tid, declarationTid, inputs);
  }

  traceWriteME = (objValue, propValue, value, tid, objectTid, inputs) => {
    value = wrapValue(value);

    // [runtime-error] potential run-time error
    objValue[propValue] = value;
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceWriteME(this.getProgramId(), value, propValue, tid, objectTid, inputs);
  }

  traceDeleteME = (objValue, propValue, tid, objectTid) => {
    // [runtime-error] potential run-time error
    const result = delete objValue[propValue];
    if (this.areTracesDisabled) {
      return result;
    }

    return this._runtimeMonitor.traceDeleteME(this.getProgramId(), result, propValue, tid, objectTid);
  }

  traceUpdateExpressionVar = (updateValue, returnValue, readTid, tid, declarationTid) => {
    if (this.areTracesDisabled) {
      return returnValue;
    }

    return this._runtimeMonitor.traceUpdateExpressionVar(this.getProgramId(), updateValue, returnValue, readTid, tid, declarationTid);
  }

  traceUpdateExpressionME = (obj, prop, updateValue, returnValue, readTid, tid, objectTid) => {
    if (this.areTracesDisabled) {
      return returnValue;
    }

    return this._runtimeMonitor.traceUpdateExpressionME(this.getProgramId(), obj, prop, updateValue, returnValue, readTid, tid, objectTid);
  }

  traceCatch = (inProgramStaticTraceId, realContextId, awaitContextId = 0) => {
    if (this.areTracesDisabled) {
      return;
    }

    this._runtimeMonitor.traceCatch(this.getProgramId(), inProgramStaticTraceId, realContextId, awaitContextId);
  }

  traceFinally = (inProgramStaticTraceId, realContextId, awaitContextId = 0) => {
    if (this.areTracesDisabled) {
      return;
    }

    this._runtimeMonitor.traceFinally(this.getProgramId(), inProgramStaticTraceId, realContextId, awaitContextId);
  }

  /** ###########################################################################
   * calls
   * ##########################################################################*/

  traceBCE = (tid, callee, calleeTid, argTids, args) => {
    callee = wrapValue(callee);
    if (this.areTracesDisabled) {
      return callee;
    }

    return this._runtimeMonitor.traceBCE(this.getProgramId(), tid, callee, calleeTid, argTids, args);
  }

  traceArg = (arg) => {
    
  }

  traceSpreadArg = () => {

  }

  traceCallResult = (value, tid, callId) => {
    value = wrapValue(value);
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceCallResult(this.getProgramId(), value, tid, callId);
  }

  /** ###########################################################################
   * ArrayExpression
   * ##########################################################################*/

  traceArrayExpression = (args, tid, argTids) => {
    // console.debug(`[Dbux traceArrayExpression] tid=${tid}, strace=${JSON.stringify(traceCollection.getStaticTraceByTraceId(tid))}`);
    const { data: { argConfigs } } = traceCollection.getStaticTraceByTraceId(tid);

    const value = [];
    const spreadLengths = new Array(args.length);
    for (let i = 0; i < args.length; ++i) {
      const arg = args[i];
      if (argConfigs[i].isSpread) {
        // compute arg length (NOTE: we cannot easily get the size of an iterator)
        const l = value.length;
        // [runtime error] potential runtime error: spreading arg
        value.push(...arg);
        spreadLengths[i] = value.length - l;
      }
      else {
        value.push(arg);
        spreadLengths[i] = -1; // not spread
      }
    }

    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceArrayExpression(this.getProgramId(), value, spreadLengths, tid, argTids);
  }

  /** ###########################################################################
   * ObjectExpression
   * ##########################################################################*/

  /**
   * 
   */
  traceObjectExpression = (entries, objectTid, propTids) => {
    // console.debug(`[Dbux traceArrayExpression] tid=${tid}, strace=${JSON.stringify(traceCollection.getStaticTraceByTraceId(tid))}`);
    const { data: { argConfigs } } = traceCollection.getStaticTraceByTraceId(objectTid);

    // compute final object
    const value = {};
    const spreadLengths = new Array(entries.length);
    for (let i = 0; i < entries.length; ++i) {
      const cfg = argConfigs[i];
      if (cfg.isSpread) {
        // Get all arg spread keys.
        // The spread operator observes `Object.assign` semantics.
        // Explained in: https://babeljs.io/docs/en/babel-plugin-proposal-object-rest-spread
        /**
         * It is important to use spread (or `Object.assign` before using the spreaded object), as shown in the following example.
         * NOTE: The following will not succeed, if one used `Object.keys` to substitute `Object.assign`.
         * NOTE2: That is why `lodash.size` is also incorrect - https://github.com/lodash/lodash/blob/2f79053d7bc7c9c9561a30dda202b3dcd2b72b90/size.js#L40
         * @example
         * ```
           function f() {}
           var o = {};
           Object.assign(f, { get x() { return 1; } });
           Object.assign(o, f)
           console.assert(!!o.x);
           o
         * ```
         */

        // NOTE: object spreading does not throw (more lenient than array and argument spreading)
        const o = { ...entries[i] };
        Object.assign(value, o);

        // store spreaded object back in `entries`, for creating `DataNode`s
        entries[i] = o;
      }
      else {
        const [key, entryVal] = entries[i];

        if (cfg.kind && cfg.kind !== 'method') {
          // see https://babeljs.io/docs/en/babel-types#objectmethod
          Object.defineProperty(value, key, {
            configurable: true,
            enumerable: true,
            [cfg.kind]: entryVal
          });
        }
        else {
          value[key] = entryVal;
        }
        spreadLengths[i] = -1; // not spread
      }
    }

    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceObjectExpression(this.getProgramId(), value, entries, argConfigs, objectTid, propTids);
  }

  // /** ###########################################################################
  //  * loops
  //  * ##########################################################################*/

  // traceForIn = (value, tid, declarationTid, inputs) => {
  //   value = wrapValue(value);
  //   if (this.areTracesDisabled) {
  //     return value;
  //   }

  //   return this._runtimeMonitor.traceForIn(this.getProgramId(), value, tid, declarationTid, inputs);
  // }

  // ###########################################################################
  // old traces
  // ###########################################################################

  /**
   * `t` is short for `trace`
   */
  t(inProgramStaticTraceId) {
    if (this.areTracesDisabled) {
      return 0;
    }
    return this._runtimeMonitor.trace(this.getProgramId(), inProgramStaticTraceId);
  }

  /**
   * 
   */
  traceExpr(inProgramStaticTraceId, value) {
    value = wrapValue(value);
    // this._logger.debug('trace expr', { inProgramStaticTraceId, value });
    if (this.areTracesDisabled) {
      return value;
    }
    return this._runtimeMonitor.traceExpression(this.getProgramId(), inProgramStaticTraceId, value);
  }

  traceArg(inProgramStaticTraceId, value) {
    value = wrapValue(value);
    if (this.areTracesDisabled) {
      return value;
    }
    return this._runtimeMonitor.traceArg(this.getProgramId(), inProgramStaticTraceId, value);
  }

  // ###########################################################################
  // loops
  // ###########################################################################

  pushLoop() {
  }

  // ###########################################################################
  // internal stuff
  // ###########################################################################

  get disabled() {
    return !!this._runtimeMonitor.disabled;
  }

  get areTracesDisabled() {
    return this._runtimeMonitor.areTracesDisabled;
  }

  warnDisabled(...args) {
    this._logger.warn(...args);
  }
}