import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

/** @typedef { import("./plugins/BranchStatement").default } BranchStatement */

export default class ConditionalExpression extends BaseNode {
  static children = ['test', 'consequent', 'alternate'];
  /**
   * @type {BranchStatement}
   */
  get BranchStatement() {
    return this.getPlugin('BranchStatement');
  }

  // TODO: proper DataNodes
  //    → this actually passes on one of the input values
  //    → after fixing this, apply same fix to LogicalExpression

  exit() {
    const { path } = this;
    const [testNode] = this.getChildNodes();
    const [testPath, result1, result2] = this.getChildPaths();

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.BranchExpression,
        dataNode: {
          isNew: false,
          label: '?:'
        }
      }
    };

    const testTrace = testNode.Traces.addDefaultTrace(testPath);
    const ownTrace = this.Traces.addTraceWithInputs(traceData, [result1, result2]);

    this.addBranchLogic(testTrace, ownTrace);
  }

  isControlGroupMergedWithParent() {
    const parent = this.getParent();
    if (parent instanceof ConditionalExpression) {
      const [/* testNode */, /* consequentNode */, elseNode] = parent.getChildNodes();
      if (
        elseNode === this
      ) {
        // this is an "else if" → merge with parent
        return true;
      }
    }
    return false;
  }

  /**
   * @param {TraceCfg} testTrace 
   * @param {TraceCfg} ownTrace 
   */
  addBranchLogic(testTrace, ownTrace) {
    // const { path } = this;
    const { BranchStatement } = this;

    if (!this.isControlGroupMergedWithParent()) {
      // new if statement
      BranchStatement.createBranchStaticTrace(SyntaxType.Ternary);
      BranchStatement.setDecisionAndPushTrace(testTrace);
      BranchStatement.setPopTrace(ownTrace);
    }
    else {
      BranchStatement.setDecisionTrace(testTrace);
    }
  }
}
