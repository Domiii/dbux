// import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class IfStatement extends BaseNode {
  static children = ['test', 'consequent', 'alternate'];
  static plugins = ['BranchStatement'];

  /**
   * @type {BranchStatement}
   */
  get BranchStatement() {
    return this.getPlugin('BranchStatement');
  }

  exit() {
    // const { path } = this;
    const { BranchStatement } = this;
    const [test] = this.getChildPaths();

    const testTrace = this.Traces.addDefaultTrace(test);

    BranchStatement.setDecisionTrace(testTrace);
    BranchStatement.setPushTrace(testTrace);
    BranchStatement.addNewPopTrace();
  }
}