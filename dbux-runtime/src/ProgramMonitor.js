import { newLogger } from '@dbux/common/src/log/logger';

/**
 * Comes from the order we execute things in programVisitor
 */
const ProgramStartTraceId = 1;

/**
 * Comes from the order we execute things in programVisitor
 */
const ProgramStopTraceId = 2;

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
    const inProgramStaticId = 1;
    this._runtimeMonitor = runtimeMonitor;
    this._staticProgramContext = staticProgramContext;
    this._programContextId = this.pushImmediate(inProgramStaticId, ProgramStartTraceId, false);
    this._logger = newLogger(staticProgramContext.filePath);
  }

  /**
   * NOTE - A program has 3 kinds of ids:
   * 1. programId (assigned by `staticProgramContextCollection`; you usually want to use this one)
   * 2. inProgramStaticId (assigned by instrumentation; currently always equal to 1)
   * 3. programContextId (assigned by `executionContextCollection`; globally unique across contexts)
   */
  getProgramId() {
    return this._staticProgramContext.programId;
  }

  getProgramContextId() {
    return this._programContextId;
  }

  // ###########################################################################
  // context management
  // ###########################################################################

  pushImmediate(inProgramStaticId, traceId, isInterruptable) {
    if (this.disabled) {
      return 0;
    }

    return this._runtimeMonitor.pushImmediate(this.getProgramId(), inProgramStaticId, traceId, isInterruptable);
  }

  popImmediate(contextId, traceId) {
    if (this.disabled) {
      return undefined;
    }

    return this._runtimeMonitor.popImmediate(contextId, traceId);
  }

  popFunction(contextId, traceId) {
    if (this.disabled) {
      return undefined;
    }

    return this._runtimeMonitor.popFunction(contextId, traceId);
  }


  // CallbackArgument(inProgramStaticId, schedulerId, traceId, cb) {
  //   return this._runtimeMonitor.CallbackArgument(this.getProgramId(), 
  //     inProgramStaticId, schedulerId, traceId, cb);
  // }

  preAwait(inProgramStaticId, traceId) {
    if (this.disabled) {
      // TODO: calling asynchronous methods when disabled hints at non-pure getters and will most likely cause trouble :(
      this._logger.error(`Encountered await in disabled call #${traceId} (NOTE: dbux does not play well with impure getters, especially if tey  call asynchronous code)`);
      return 0;
    }
    return this._runtimeMonitor.preAwait(this.getProgramId(), inProgramStaticId, traceId);
  }

  wrapAwait(awaitContextId, awaitValue) {
    // nothing to do
    return this._runtimeMonitor.wrapAwait(this.getProgramId(), awaitContextId, awaitValue);
  }

  postAwait(awaitResult, awaitContextId, resumeTraceId) {
    return this._runtimeMonitor.postAwait(this.getProgramId(), awaitResult, awaitContextId, resumeTraceId);
  }

  pushResume(resumeStaticContextId, inProgramStaticTraceId) {
    return this._runtimeMonitor.pushResume(this.getProgramId(), resumeStaticContextId, inProgramStaticTraceId, true);
  }

  popResume(resumeContextId) {
    return this._runtimeMonitor.popResume(resumeContextId);
  }

  popProgram() {
    // finished initializing the program
    return this.popImmediate(this._programContextId, ProgramStopTraceId);
  }

  // ###########################################################################
  // traces
  // ###########################################################################

  /**
   * `t` is short for `trace` (we have a lot of these, so we want to keep the name short)
   */
  t(inProgramStaticTraceId) {
    if (this.disabled) {
      return 0;
    }
    return this._runtimeMonitor.trace(this.getProgramId(), inProgramStaticTraceId);
  }

  /**
   * 
   */
  traceExpr(inProgramStaticTraceId, value) {
    if (this.disabled) {
      return value;
    }
    return this._runtimeMonitor.traceExpression(this.getProgramId(), inProgramStaticTraceId, value);
  }

  traceArg(inProgramStaticTraceId, value) {
    if (this.disabled) {
      return value;
    }
    return this._runtimeMonitor.traceArg(this.getProgramId(), inProgramStaticTraceId, value);
  }

  // ###########################################################################
  // values
  // ###########################################################################

  addVarAccess(inProgramStaticVarAccessId, value) {
    if (this.disabled) {
      return value;
    }
    return this._runtimeMonitor.addVarAccess(this.getProgramId(), inProgramStaticVarAccessId, value);
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
    return this._runtimeMonitor.disabled;
  }

  warnDisabled(...args) {
    this._logger.warn(...args);
  }
}