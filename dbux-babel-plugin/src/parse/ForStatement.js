import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
import BaseNode from './BaseNode';

export default class ForStatement extends BaseNode {
  static children = ['init', 'test', 'update', 'body'];

  static plugins = [
    'Loop'
  ];

  /**
   * @type {import('./plugins/Loop').default}
   */
  get Loop() {
    return this.getPlugin('Loop');
  }

  exit() {
    const {
      Loop: {
        BranchStatement
      }
    } = this;
    const [initNode, testNode, updateNode] = this.getChildNodes();

    if (initNode.path.node) {
      // TODO: all tid variable declarationTids from `init` need to be inlined
      // TODO: merge decl + write, of `init` variables, if they are not `var`
      initNode.Traces.addDefaultTrace(initNode.path);
    }
    if (testNode.path.node) {
      testNode.Traces.addDefaultTrace(testNode.path);
    }
    if (updateNode.path.node) {
      updateNode.traces.addDefaultTrace(updateNode.path);
    }

    // set up branch data
    this.BranchStatement.createBranchStaticTrace(SyntaxType.For);

    const testTrace = testNode.traceCfg;
    if (testTrace) {
      BranchStatement.addPopStatementTrace();
      BranchStatement.setDecisionTrace(testTrace);
      BranchStatement.addPopStatementTrace();
    }
  }
}
