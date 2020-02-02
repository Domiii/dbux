/**
 * Comes from the order we execute things in programVisitor
 */
const ProgramStartTraceId = 1;

/**
 * Comes from the order we execute things in programVisitor
 */
const ProgramStopTraceId = 2;

export default class ProgramMonitor {
  /**
   * @type {ProgramStaticContext}
   */
  _staticProgramContext;

  /**
   * @param {ProgramStaticContext} staticProgramContext
   */
  constructor(runtimeMonitor, staticProgramContext) {
    const inProgramStaticId = 1;
    this._runtimeMonitor = runtimeMonitor;
    this._staticProgramContext = staticProgramContext;
    this._programContextId = this.pushImmediate(inProgramStaticId, ProgramStartTraceId);
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


  pushImmediate(inProgramStaticId, traceId) {
    return this._runtimeMonitor.pushImmediate(this.getProgramId(), inProgramStaticId, traceId);
  }

  popImmediate(contextId, traceId) {
    return this._runtimeMonitor.popImmediate(contextId, traceId);
  }


  scheduleCallback(inProgramStaticId, schedulerId, traceId, cb) {
    return this._runtimeMonitor.scheduleCallback(this.getProgramId(), 
      inProgramStaticId, schedulerId, traceId, cb);
  }

  preAwait(inProgramStaticId, traceId) {
    return this._runtimeMonitor.preAwait(this.getProgramId(), inProgramStaticId, traceId);
  }

  wrapAwait(awaitContextId, awaitValue) {
    // nothing to do
    return this._runtimeMonitor.wrapAwait(this.getProgramId(), awaitContextId, awaitValue);
  }

  postAwait(awaitResult, awaitContextId, resumeTraceId) {
    return this._runtimeMonitor.postAwait(awaitResult, awaitContextId, resumeTraceId);
  }

  pushResume(resumeContextId, traceId, schedulerId) {
    return this._runtimeMonitor.pushResume(resumeContextId, traceId, schedulerId, true);
  }

  popResume() {
    return this._runtimeMonitor.popResume();
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
    return this._runtimeMonitor.trace(this.getProgramId(), inProgramStaticTraceId);
  }

  /**
   * 
   */
  traceExpr(inProgramStaticTraceId, value) {
    return this._runtimeMonitor.traceExpression(this.getProgramId(), inProgramStaticTraceId, value);
  }

  traceArg(inProgramStaticTraceId, value) {
    return this._runtimeMonitor.traceArg(this.getProgramId(), inProgramStaticTraceId, value);
  }

}