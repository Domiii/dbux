import RuntimeMonitor from './RuntimeMonitor';

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
  constructor(staticProgramContext) {
    const staticId = 1;
    this._staticProgramContext = staticProgramContext;
    this._programContextId = this.pushImmediate(staticId, ProgramStartTraceId);
  }

  /**
   * NOTE - A program has 3 kinds of ids:
   * 1. staticId (assigned by instrumentation; currently always equal to 1; unique inside the same program)
   * 2. programId (assigned by `staticProgramContextCollection`; globally unique across programs)
   * 3. contextId (assigned by `executionContextCollection`; globally unique across contexts)
   */
  getProgramId() {
    return this._staticProgramContext.programId;
  }

  getProgramContextId() {
    return this._programContextId;
  }



  pushImmediate(inProgramStaticId, traceId) {
    return RuntimeMonitor.instance.pushImmediate(this.getProgramId(), inProgramStaticId, traceId);
  }

  popImmediate(contextId, traceId) {
    return RuntimeMonitor.instance.popImmediate(contextId, traceId);
  }


  scheduleCallback(inProgramStaticId, schedulerId, traceId, cb) {
    return RuntimeMonitor.instance.scheduleCallback(this.getProgramId(), inProgramStaticId, schedulerId, traceId, cb);
  }

  preAwait(inProgramStaticId, traceId) {
    return RuntimeMonitor.instance.preAwait(this.getProgramId(), inProgramStaticId, traceId);
  }

  wrapAwait(awaitContextId, awaitValue) {
    // nothing to do
    return RuntimeMonitor.instance.wrapAwait(this.getProgramId(), awaitContextId, awaitValue);
  }

  postAwait(awaitResult, awaitContextId, resumeTraceId) {
    return RuntimeMonitor.instance.postAwait(awaitResult, awaitContextId, resumeTraceId);
  }

  pushResume(resumeContextId, traceId, schedulerId) {
    return RuntimeMonitor.instance.pushResume(resumeContextId, traceId, schedulerId, true);
  }

  popResume() {
    return RuntimeMonitor.instance.popResume();
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
  t(inProgramStaticTraceId, value) {
    return RuntimeMonitor.instance.trace(inProgramStaticTraceId, value);
  }

  /**
   * `tv` is short for `traceAndCaptureValue` (we have a lot of these, so we want to keep the name short)
   */
  tv(inProgramStaticTraceId, value) {
    return RuntimeMonitor.instance.traceAndCaptureValue(inProgramStaticTraceId, value);
  }

}