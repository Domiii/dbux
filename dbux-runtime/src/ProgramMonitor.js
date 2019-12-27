import RuntimeMonitor from './RuntimeMonitor';


export default class ProgramMonitor {
  /**
   * @type {ProgramStaticContext}
   */
  _programStaticContext;

  /**
   * @param {ProgramStaticContext} programStaticContext
   */
  constructor(programStaticContext) {
    this._programStaticContext = programStaticContext;
    const { staticId } = this._programStaticContext;
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
    const orderId = StaticContextManager.instance.genContextId(this.getProgramId(), staticContextId);
    const scheduledContextId = ExecutionContextManager.instance.schedule(
      this.getProgramId(), staticContextId, orderId, schedulerId, stack
    );
    RuntimeMonitor.instance.scheduleCallback(scheduledContextId);
    return makeCallbackWrapper(this, scheduledContextId, cb);
  }

  pushCallbackLink(scheduledContextId) {
    const callbackLinkId = `TODO`;
  }

  popCallbackLink(callbackLinkId) {

  }

  popProgram() {
    // finished initializing the program
    return this.popImmediate(this._programContextId);
  }
}