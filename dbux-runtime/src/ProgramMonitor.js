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
    this.push(getStaticContextId());
  }

  getProgramId() {
    return this._programStaticContext.getProgramId();
  }

  push(staticContextId) {
    const orderId = StaticContextManager.instance.genContextId(this.getProgramId(), staticContextId);
    // const context = new ExecutionContext(staticContextId, schedulerId, orderId);
    const contextId = ExecutionContextManager.instance().push(this.getProgramId(), staticContextId, orderId);
    return RuntimeMonitor.instance.push(contextId);
  }

  pop() {

  }

  scheduleCallback(staticContextId, schedulerId) {
    const scheduledContextId = `TODO`;
  }

  pushCallbackLink(scheduledContextId) {
    const callbackLinkId = `TODO`;
  }

  popCallbackLink(callbackLinkId) {

  }

  popProgram() {
    // finished initializing the program
    return this.pop(getStaticContextId());
  }
}