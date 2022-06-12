// import TraceType from '@dbux/common/src/types/constants/TraceType';
import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
import BaseNode from './BaseNode';

/** @typedef { import("./plugins/BranchStatement").default } BranchStatement */

export default class IfStatement extends BaseNode {
  static children = ['test', 'consequent', 'alternate'];
  static plugins = ['BranchStatement'];

  _isControlGroupMergedWithParent = undefined;

  isControlGroupMergedWithParent() {
    if (this._isControlGroupMergedWithParent === undefined) {
      const parent = this.getParent();
      if (parent instanceof IfStatement) {
        const [/* testNode */, /* consequentNode */, elsePath] = parent.getChildPaths();
        if (
          elsePath === this.path ||
          (elsePath.isBlockStatement() && elsePath.body?.length === 1 && elsePath.body[0] === this)
        ) {
          // this is an "else if" → merge with parent
          this._isControlGroupMergedWithParent = true;
        }
      }
      this._isControlGroupMergedWithParent ||= false;
    }
    return this._isControlGroupMergedWithParent;
  }

  /**
   * @type {BranchStatement}
   */
  get BranchStatement() {
    if (this.isControlGroupMergedWithParent()) {
      return this.getParent().BranchStatement;
    }
    return this.getPlugin('BranchStatement');
  }

  /**
   * First handle branch root.
   */
  exit1() {
    // this.logger.debug(`[exit1] ${this.debugTag} ${!!testTrace} ${this.isControlGroupRoot()}`);
    if (!this.isControlGroupMergedWithParent()) {
      // new if statement
      const { BranchStatement } = this;
      BranchStatement.createBranchStaticTrace(SyntaxType.If);
    }
  }

  /**
   * Handle merges after root is already taken care of.
   */
  exit() {
    const [testNode] = this.getChildNodes();

    testNode.Traces.addDefaultTrace(testNode.path);
    const testTrace = testNode.traceCfg;

    // this.logger.debug(`[exit] ${this.debugTag}, ${!!testTrace}, ${this.isControlGroupMergedWithParent()}`);

    // const { path } = this;
    if (testTrace) {
      const { BranchStatement } = this;
      if (this.isControlGroupMergedWithParent()) {
        // merged if statement
        BranchStatement.setDecisionTrace(testTrace);
      }
      else {
        // root if statement
        BranchStatement.setDecisionAndPushTrace(testTrace);
        BranchStatement.insertPopTraceBehind();
      }
    }
  }

  // instrument1() {
  //   if (this.isControlGroupMergedWithParent()) {
  //     // merge multiple if/else statements into one
  //     const { BranchStatement } = this;
  //     const [test] = this.getChildPaths();

  //     // decision trace will automatically be added to ancestor control group 
  //     BranchStatement.setDecisionTrace(test.traceCfg);
  //   }
  // }
}