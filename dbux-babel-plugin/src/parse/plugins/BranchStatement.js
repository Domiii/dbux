import TraceControlRole from '@dbux/common/src/types/constants/TraceControlRole';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import StaticTrace from '@dbux/common/src/types/StaticTrace';
import BasePlugin from './BasePlugin';

/** @typedef { import("../../definitions/TraceCfg").default } TraceCfg */

/**
 * 
 */
export default class BranchStatement extends BasePlugin {
  controlStatementId;

  /**
   * 
   */
  createBranchStaticTrace() {
    const {
      node: {
        path,
        // name,
        state
      }
    } = this;

    // const syntaxType = SyntaxType.valueFromForce(name);

    const staticTraceData = {
      type: TraceType.BranchStatement,
      // syntax: syntaxType
    };
    this.controlStatementId = state.traces.addTrace(path, staticTraceData);
  }

  /**
   * @param {TraceCfg} trace 
   */
  setBranchStaticTrace(trace) {
    this.controlStatementId = trace.inProgramStaticTraceId;
  }

  /**
   * @param {TraceCfg} trace 
   */
  setDecisionTrace(trace) {
    trace.staticTraceData.controlRole = TraceControlRole.Decision;
  }

  /**
   * 
   * @param {TraceCfg} trace 
   */
  setPushTrace(trace) {
    trace.staticTraceData.controlRole = TraceControlRole.Push;

    const branchTrace = this.createBranchStaticTrace();
    trace.staticTraceData.controlId = branchTrace._traceId;
  }

  /**
   * @param {TraceCfg} trace 
   */
  setDecisionAndPushTrace(trace) {
    trace.staticTraceData.controlRole = TraceControlRole.PushAndDecision;

    const branchTrace = this.createBranchStaticTrace();
    trace.staticTraceData.controlId = branchTrace._traceId;
  }

  /**
   * Inserts a new pop trace behind this.node.
   * @param {TraceCfg} trace 
   */
  createPopStatementTrace() {
    const trace = this.addTrace(path, {
      staticTraceData: {
      },
      TODO
    });

    TODO;

    this.setPopStatementTrace(trace);

    return trace;
  }

  /**
   * @param {TraceCfg} trace 
   */
  setPopStatementTrace(trace) {
    trace.staticTraceData.controlRole = TraceControlRole.Pop;
    trace.staticTraceData.controlId = this.controlStatementId;
  }
}
