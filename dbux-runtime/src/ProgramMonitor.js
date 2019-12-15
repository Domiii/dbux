import RuntimeMonitor from './RuntimeMonitor';

function getProgramStaticContextId() {
  return 0;
}

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
    this.pushImmediate(getProgramStaticContextId());
  }

  getProgramId() {
    return this._programStaticContext.getProgramId();
  }

  pushImmediate(staticContextId) {
    return RuntimeMonitor.instance.pushImmediate(this.getProgramId(), staticContextId);
  }

  popImmediate(contextId) {
    return RuntimeMonitor.instance.popImmediate(contextId);
  }


  // scheduleCallback(staticContextId, schedulerId, cb) {
  //   const orderId = StaticContextManager.instance.genContextId(this.getProgramId(), staticContextId);
  //   const scheduledContextId = ExecutionContextManager.instance.schedule(
  //     this.getProgramId(), staticContextId, orderId, schedulerId, stack
  //   );
  //   RuntimeMonitor.instance.scheduleCallback(scheduledContextId);
  //   return makeCallbackWrapper(this, scheduledContextId, cb);
  // }

  // pushCallbackLink(scheduledContextId) {
  //   const callbackLinkId = `TODO`;
  // }

  // popCallbackLink(callbackLinkId) {

  // }

  popProgram() {
    // finished initializing the program
    return this.popImmediate(getProgramStaticContextId());
  }
}