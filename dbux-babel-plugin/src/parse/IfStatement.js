// import TraceType from '@dbux/common/src/types/constants/TraceType';
import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
import BaseNode from './BaseNode';

/** @typedef { import("./plugins/BranchStatement").default } BranchStatement */

export default class IfStatement extends BaseNode {
  static children = ['test', 'consequent', 'alternate'];
  static plugins = ['BranchStatement'];

  /**
   * @type {BranchStatement}
   */
  get BranchStatement() {
    return this.getPlugin('BranchStatement');
  }

  isControlGroupMergedWithParent() {
    const parent = this.getParent();
    if (parent instanceof IfStatement) {
      const [/* testNode */, /* consequentNode */, elseNode] = parent.getChildNodes();
      if (
        elseNode === this ||
        (elseNode?.path.isBlockStatement() && elseNode.body?.length === 1 && elseNode.body[0] === this)
      ) {
        // this is an "else if" → merge with parent
        return true;
      }
    }
    return false;
  }

  exit() {
    // const { path } = this;
    const { BranchStatement } = this;
    const [test] = this.getChildPaths();

    const testTrace = test.Traces.addDefaultTrace(test);

    if (!this.isControlGroupMergedWithParent()) {
      // new if statement
      BranchStatement.createBranchStaticTrace(SyntaxType.If);
      BranchStatement.setDecisionAndPushTrace(testTrace);
      BranchStatement.createPopStatementTrace();
    }
    else {
      BranchStatement.setDecisionTrace(testTrace);
    }
  }

  instrument1() {
    if (this.isControlGroupMergedWithParent()) {
      // merge multiple if/else statements into one
      const { BranchStatement } = this;
      const [test] = this.getChildPaths();

      // decision trace will automatically be added to ancestor control group 
      BranchStatement.setDecisionTrace(test.traceCfg);
    }
  }
}