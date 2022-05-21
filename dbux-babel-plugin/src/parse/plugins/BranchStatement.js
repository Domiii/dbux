import ControlTraceRole from '@dbux/common/src/types/constants/ControlTraceRole';
import StaticTrace from '@dbux/common/src/types/StaticTrace';
import BasePlugin from './BasePlugin';

/**
 * 
 */
export default class BranchStatement extends BasePlugin {
  controlStatementId;

  /**
   * @return {StaticTrace}
   */
  createBranchStaticTrace() {
    TODO
  }

  /**
   * 
   * @param {TraceCfg} trace 
   */
  setDecisionTrace(trace) {
    trace.staticTraceData.controlRole = ControlTraceRole.Decision;
  }

  /**
   * 
   * @param {TraceCfg} trace 
   */
  setPushTrace(trace) {
    const branchTrace = this.createBranchStaticTrace();

    trace.staticTraceData.controlRole = ControlTraceRole.Push;
    trace.staticTraceData.controlId = branchTrace._traceId;
  }

  addNewPopTrace() {
    TODO;
    trace.staticTraceData.controlRole = ControlTraceRole.Pop;
    trace.staticTraceData.controlId = branchTrace._traceId;
  }

  enter() {
    // TODO: add static branch statement
  }
}
