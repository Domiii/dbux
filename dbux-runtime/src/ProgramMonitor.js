import RuntimeMonitor from './RuntimeMonitor';
import staticContextCollection from './data/collections/staticContextCollection';


export default class ProgramMonitor {
  /**
   * @type {ProgramStaticContext}
   */
  _programStaticContext;

  /**
   * @param {ProgramStaticContext} programStaticContext
   */
  constructor(programStaticContext) {
    const staticId = 1;
    this._programStaticContext = programStaticContext;
    this._programContextId = this.pushImmediate(staticId);
  }

  /**
   * NOTE - A program has 3 kinds of ids:
   * 1. staticId (assigned by instrumentation; currently always equal to 1; unique inside the same program)
   * 2. programId (assigned by `programStaticContextCollection`; globally unique across programs)
   * 3. contextId (assigned by `executionContextCollection`; globally unique across contexts)
   */
  getProgramId() {
    return this._programStaticContext.programId;
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

  postAwait(awaitContextId) {
    return RuntimeMonitor.instance.postAwait(awaitContextId);
  }

  popProgram() {
    // finished initializing the program
    return this.popImmediate(this._programContextId);
  }
}