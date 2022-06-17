import TraceControlRole from '@dbux/common/src/types/constants/TraceControlRole';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import StaticTrace from '@dbux/common/src/types/StaticTrace';
import { TrueNode } from '../../helpers/traceUtil';
import { replaceNodeTryFinallyPop } from '../../instrumentation/builders/common';
import { buildTraceStatic } from '../../instrumentation/builders/misc';
import { insertAfterBody, insertAfterNode, insertBeforeNode, instrumentUnshiftBody } from '../../instrumentation/instrumentMisc';
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

  /** ###########################################################################
   * Assign control data to {@link StaticTrace}
   * ##########################################################################*/

  /**
   * @param {TraceCfg} trace 
   */
  setBranchStaticTrace(trace) {
    this._controlStatementId = trace.inProgramStaticTraceId;
  }

  /**
   * 
   * @param {TraceCfg} trace 
   */
  setPushTrace(trace) {
    this.node.state.traces.updateStaticTrace(trace.inProgramStaticTraceId, {
      controlRole: TraceControlRole.Push,
      controlId: this.controlStatementId
    });
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
   * @param {TraceCfg} trace 
   */
  setDecisionAndPushTrace(trace) {
    this.node.state.traces.updateStaticTrace(trace.inProgramStaticTraceId, {
      controlRole: TraceControlRole.PushAndDecision,
      controlId: this.controlStatementId
    });
  }

  /**
   * @param {TraceCfg} trace 
   */
  setPopTrace(trace) {
    this.node.state.traces.updateStaticTrace(trace.inProgramStaticTraceId, {
      controlRole: TraceControlRole.Pop,
      controlId: this.controlStatementId
    });
  }

  /** ###########################################################################
   * insert push + pop
   *  #########################################################################*/


  /**
   * Inserts a new pop trace before the branch node.
   * @param {TraceCfg} trace 
   */
  insertPushTraceInFront() {
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
        type: TraceType.BranchPush
      },
      meta: {
        noTidIdentifier: true,
        build: buildTraceStatic,
        instrument: insertBeforeNode,
        traceCall: 'newTraceId'
      }
    });

    this.setPushTrace(trace);

    return trace;
  }

  /**
   * Inserts a new pop trace behind the branch node.
   * @param {TraceCfg} trace 
   */
  insertPopTraceBehind() {
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
        // build: buildTraceStatic,
        traceCall: 'newTraceId',
        instrument: (state, traceCfg) => {
          // insertAfterNode()
          const pops = [buildTraceStatic(state, traceCfg)];
          replaceNodeTryFinallyPop(path, pops);
        }
      }
    });

    this.setPopTrace(trace);

    return trace;
  }

  insertDecisionTraceBeforeBody() {
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
        type: TraceType.BranchDecision
      },
      meta: {
        noTidIdentifier: true,
        isStatement: true, // make ExpressionStatement
        // build: buildTraceStatic, // NOTE: default = buildTraceExpression
        // traceCall: 'newTraceId',

        // NOTE: we need a DataNode, so we simply pass in `true`
        targetNode() { return TrueNode; },

        instrument: instrumentUnshiftBody,
      }
    });

    this.setDecisionTrace(trace);

    return trace;
  }
}
