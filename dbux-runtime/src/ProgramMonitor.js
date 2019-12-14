import StaticContextManager from './StaticContextManager';
import RuntimeMonitor from './RuntimeMonitor';
import ExecutionContext from './ExecutionContext';
import ExecutionContextManager from './ExecutionContextManager';

function getStaticContextId() {
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
    this.pushImmediate(getStaticContextId());
  }

  getProgramId() {
    return this._programStaticContext.getProgramId();
  }

  pushImmediate(staticContextId) {
    const orderId = StaticContextManager.instance.genContextId(this.getProgramId(), staticContextId);
    const contextId = ExecutionContextManager.instance.immediate(this.getProgramId(), staticContextId, orderId);
    RuntimeMonitor.instance.pushImmediate(contextId);
    return contextId;
  }

  popImmediate(contextId) {

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
    return this.popImmediate(getStaticContextId());
  }
}