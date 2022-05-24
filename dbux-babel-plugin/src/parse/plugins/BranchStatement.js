import TraceControlRole from '@dbux/common/src/types/constants/TraceControlRole';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import StaticTrace from '@dbux/common/src/types/StaticTrace';
import { buildTraceStatic } from '../../instrumentation/builders/misc';
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
  get controlStatementId() {
    if (!this._controlStatementId) {
      throw new Error(`Tried to get controlStatementId too early in: ${this.debugTag}`);
    }
    return this._controlStatementId;
  }

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
    return this._controlStatementId = state.traces.addTrace(path, staticTraceData);
  }

  /**
   * @param {TraceCfg} trace 
   */
  setBranchStaticTrace(trace) {
    this._controlStatementId = trace.inProgramStaticTraceId;
  }

  /**
   * @param {TraceCfg} trace 
   */
  setDecisionTrace(trace) {
    this.node.state.traces.updateStaticTrace(trace.inProgramStaticTraceId, {
      controlRole: TraceControlRole.Decision,
      controlId: this.controlStatementId
    });
  }

  /**
   * 
   * @param {TraceCfg} trace 
   */
  setPushTrace(trace) {
    this.node.state.traces.updateStaticTrace(trace.inProgramStaticTraceId, {
      controlRole: TraceControlRole.Push,
      // add branch trace to push trace
      controlId: this.controlStatementId
    });
  }

  /**
   * @param {TraceCfg} trace 
   */
  setDecisionAndPushTrace(trace) {
    this.node.state.traces.updateStaticTrace(trace.inProgramStaticTraceId, {
      controlRole: TraceControlRole.PushAndDecision,
      // add branch trace to push trace
      controlId: this.controlStatementId
    });
  }

  /**
   * Inserts a new pop trace behind the branch node.
   * @param {TraceCfg} trace 
   */
  createPopStatementTrace() {
    const {
      node,
      node: {
        path,
        Traces
      }
    } = this;

    const trace = Traces.addTrace({
      path,
      node,
      staticTraceData: {
        type: TraceType.BranchPop
      },
      meta: {
        noTidIdentifier: true,
        build: buildTraceStatic,
        instrument: insertAfterNode,
        traceCall: 'newTraceId'
      }
    });

    this.setPopStatementTrace(trace);

    return trace;
  }

  /**
   * @param {TraceCfg} trace 
   */
  setPopStatementTrace(trace) {
    this.node.state.traces.updateStaticTrace(trace.inProgramStaticTraceId, {
      controlRole: TraceControlRole.Pop,
      controlId: this.controlStatementId
    });
  }
}
