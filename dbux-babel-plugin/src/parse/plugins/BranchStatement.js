import TraceControlRole from '@dbux/common/src/types/constants/TraceControlRole';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import StaticTrace from '@dbux/common/src/types/StaticTrace';
import { insertAfterNode } from '../../instrumentation/instrumentMisc';
import BasePlugin from './BasePlugin';

/** @typedef { import("../../definitions/TraceCfg").default } TraceCfg */

/**
 * 
 */
export default class BranchStatement extends BasePlugin {
  /**
   * The `inProgramStaticTraceId` of the control statement StaticTrace.
   * @type {number}
   */
  controlStatementId;

  /**
   * Create and insert {@link StaticTrace} representing this branch.
   * It might not have its own `trace`, but might instead get referenced by the multi-purpose push trace.
   */
  createBranchStaticTrace(syntaxType) {
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
      syntax: syntaxType
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

    // add branch trace to push trace
    const branchTrace = this.createBranchStaticTrace();
    trace.staticTraceData.controlId = branchTrace._traceId;
  }

  /**
   * @param {TraceCfg} trace 
   */
  setDecisionAndPushTrace(trace) {
    trace.staticTraceData.controlRole = TraceControlRole.PushAndDecision;

    // add branch trace to push trace
    const branchTrace = this.createBranchStaticTrace();
    trace.staticTraceData.controlId = branchTrace._traceId;
  }

  /**
   * Inserts a new pop trace behind the branch node.
   * @param {TraceCfg} trace 
   */
  createPopStatementTrace() {
    const {
      node: {
        path
      }
    } = this;

    const trace = this.addTrace(path, {
      staticTraceData: {
        type: TraceType.PopBranch
      },
      meta: {
        instrument: insertAfterNode
      }
    });

    this.setPopStatementTrace(trace);

    return trace;
  }

  /**
   * @param {TraceCfg} trace 
   */
  setPopStatementTrace(trace) {
    trace.staticTraceData.controlRole = TraceControlRole.Pop;
    // trace.staticTraceData.controlId = this.controlStatementId;
  }
}
