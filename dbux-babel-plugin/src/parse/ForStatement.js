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
      initNode.Traces.addDefaultTrace(initNode.path);
    }
    if (testNode.path.node) {
      testNode.Traces.addDefaultTrace(testNode.path);
    }
    if (updateNode.path.node) {
      updateNode.Traces.addDefaultTrace(updateNode.path);
    }

    // set up branch data
    BranchStatement.createBranchStaticTrace(SyntaxType.For);

    const testTrace = testNode.traceCfg;
    if (testTrace) {
      BranchStatement.insertPushTrace();
      BranchStatement.setDecisionTrace(testTrace);
      BranchStatement.insertPopTrace();
    }
  }
}
