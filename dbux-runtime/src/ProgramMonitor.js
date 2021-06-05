import { newLogger } from '@dbux/common/src/log/logger';
import staticTraceCollection from './data/staticTraceCollection';
import traceCollection from './data/traceCollection';


/**
 * Comes from the order we execute things in programVisitor
 */
const ProgramStartTraceId = 1;

/**
 * Comes from the order we execute things in programVisitor
 */
const ProgramEndTraceId = 2;

/**
 * In Babel-lingo, a "Program" is one *.js file.
 * Thus the ProgramMonitor monitors a single file, 
 * while all ProgramMonitors share a single `RuntimeMonitor`.
 */
export default class ProgramMonitor {
  /**
   * @type {import('@dbux/common/src/core/data/StaticProgramContext').default}
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
    this._programContextId = this.pushImmediate(inProgramStaticContextId, ProgramStartTraceId, false);
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

  // ###########################################################################
  // context management
  // ###########################################################################

  pushImmediate = (inProgramStaticContextId, inProgramStaticTraceId, isInterruptable) => {
    if (this.disabled) {
      return 0;
    }

    const tracesDisabled = this.areTracesDisabled;
    return this._runtimeMonitor.pushImmediate(
      this.getProgramId(),
      inProgramStaticContextId,
      inProgramStaticTraceId,
      isInterruptable,
      tracesDisabled
    );
  }

  popImmediate = (contextId, traceId) => {
    if (this.disabled) {
      return undefined;
    }

    return this._runtimeMonitor.popImmediate(contextId, traceId);
  }

  popFunction = (contextId, traceId) => {
    if (this.disabled) {
      return undefined;
    }

    return this._runtimeMonitor.popFunction(contextId, traceId);
  }

  popProgram = () => {
    // finished initializing the program
    return this.popImmediate(this._programContextId, ProgramEndTraceId);
  }

  // ###########################################################################
  // await/async
  // TODO: allow disabling tracing these?
  // ###########################################################################

  // CallbackArgument(inProgramStaticContextId, schedulerId, traceId, cb) {
  //   return this._runtimeMonitor.CallbackArgument(this.getProgramId(), 
  //     inProgramStaticContextId, schedulerId, traceId, cb);
  // }

  preAwait = (inProgramStaticContextId, traceId) => {
    if (this.disabled) {
      // TODO: calling asynchronous methods when disabled hints at non-pure getters and will most likely cause trouble :(
      this._logger.error(`Encountered await in disabled call #${traceId} (NOTE: dbux does not play well with impure getters, especially if tey  call asynchronous code)`);
      return 0;
    }
    return this._runtimeMonitor.preAwait(this.getProgramId(), inProgramStaticContextId, traceId);
  }

  wrapAwait = (awaitContextId, awaitValue) => {
    // nothing to do
    return this._runtimeMonitor.wrapAwait(this.getProgramId(), awaitContextId, awaitValue);
  }

  postAwait = (awaitResult, awaitContextId, resumeTraceId) => {
    return this._runtimeMonitor.postAwait(this.getProgramId(), awaitResult, awaitContextId, resumeTraceId);
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

  newTraceId = (inProgramStaticTraceId) => {
    if (this.areTracesDisabled) {
      return -1;
    }
    return this._runtimeMonitor.newTraceId(this.getProgramId(), inProgramStaticTraceId);
  }

  traceDeclaration = (inProgramStaticTraceId) => {
    if (this.areTracesDisabled) {
      return -1;
    }

    return this._runtimeMonitor.traceDeclaration(this.getProgramId(), inProgramStaticTraceId);
  }

  traceExpression = (value, tid, declarationTid, inputs) => {
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceExpression(this.getProgramId(), value, tid, declarationTid, inputs);
  }

  traceWrite = (value, tid, declarationTid, inputs, deferTid) => {
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceWrite(this.getProgramId(), value, tid, declarationTid, inputs, deferTid);
  }

  traceBCE = (tid, argTids, spreadLengths) => {
    if (this.areTracesDisabled) {
      return;
    }

    this._runtimeMonitor.traceBCE(this.getProgramId(), tid, argTids, spreadLengths);
  }

  traceCallResult = (value, tid, callTid) => {
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceCallResult(this.getProgramId(), value, tid, callTid);
  }

  traceMemberExpressionOptional(objValue, propValue, tid, inputs) {
    const value = objValue?.[propValue];
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceMemberExpression(this.getProgramId(), value, propValue, tid, inputs);
  }

  traceMemberExpression(objValue, propValue, tid, inputs) {
    // [runtime-error] this commonly generates run-time errors
    const value = objValue[propValue];
    if (this.areTracesDisabled) {
      return value;
    }

    return this._runtimeMonitor.traceMemberExpression(this.getProgramId(), value, propValue, tid, inputs);
  }

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
    if (this.areTracesDisabled) {
      return value;
    }
    return this._runtimeMonitor.traceExpression(this.getProgramId(), inProgramStaticTraceId, value);
  }

  traceArg(inProgramStaticTraceId, value) {
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
    return this.disabled || !!this._runtimeMonitor.tracesDisabled;
  }

  warnDisabled(...args) {
    this._logger.warn(...args);
  }
}