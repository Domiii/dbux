import RuntimeMonitor from './RuntimeMonitor';
import staticContextCollection from './data/collections/staticContextCollection';


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
    this._programContextId = this.pushImmediate(staticId);
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

  pushImmediate(staticContextId, isInterruptable) {
    return RuntimeMonitor.instance.pushImmediate(this.getProgramId(), staticContextId, isInterruptable);
  }

  popImmediate(contextId) {
    return RuntimeMonitor.instance.popImmediate(contextId);
  }


  scheduleCallback(staticContextId, schedulerId, cb) {
    return RuntimeMonitor.instance.scheduleCallback(this.getProgramId(), staticContextId, schedulerId, cb);
  }

  preAwait(staticContextId) {
    return RuntimeMonitor.instance.preAwait(this.getProgramId(), staticContextId);
  }

  wrapAwait(awaitContextId, awaitValue) {
    // nothing to do
    return RuntimeMonitor.instance.wrapAwait(this.getProgramId(), awaitContextId, awaitValue);
  }

  postAwait(awaitResult, awaitContextId) {
    return RuntimeMonitor.instance.postAwait(awaitResult, awaitContextId);
  }

  pushResume(resumeContextId, schedulerId) {
    return RuntimeMonitor.instance.pushResume(resumeContextId, schedulerId);
  }

  popResume() {
    return RuntimeMonitor.instance.popResume();
  }

  popProgram() {
    // finished initializing the program
    return this.popImmediate(this._programContextId);
  }

  // ###########################################################################
  // traces
  // ###########################################################################

  /**
   * `t` is short for `trace` (we have a lot of these, so we want to keep the name short)
   */
  t(traceId, value) {
    return RuntimeMonitor.instance.trace(traceId, value);
  }

}