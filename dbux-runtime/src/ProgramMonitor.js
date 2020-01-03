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

  pushImmediate(staticContextId) {
    return RuntimeMonitor.instance.pushImmediate(this.getProgramId(), staticContextId);
  }

  popImmediate(contextId) {
    return RuntimeMonitor.instance.popImmediate(contextId);
  }


  scheduleCallback(staticContextId, schedulerId, cb) {
    return RuntimeMonitor.instance.scheduleCallback(this.getProgramId(), staticContextId, schedulerId, cb);
  }

  awaitId(staticContextId) {
    return RuntimeMonitor.instance.awaitId(this.getProgramId(), staticContextId);
  }

  wrapAwait(awaitContextId, awaitValue) {
    // nothing to do
    return RuntimeMonitor.instance.wrapAwait(this.getProgramId(), awaitContextId, awaitValue);
  }

  postAwait(awaitResult, awaitContextId) {
    return RuntimeMonitor.instance.postAwait(awaitResult, awaitContextId);
  }

  popProgram() {
    // finished initializing the program
    return this.popImmediate(this._programContextId);
  }

  // ###########################################################################
  // expressions
  // ###########################################################################

  /**
   * `e` is short for `expression` (we have a lot of these, so we want to keep the name short)
   */
  e(value, expressionId) {
    return RuntimeMonitor.instance.expression(value, expressionId);
  }

}