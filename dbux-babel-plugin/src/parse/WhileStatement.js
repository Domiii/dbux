import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
import BaseNode from './BaseNode';

export default class WhileStatement extends BaseNode {
  static children = ['test', 'body'];

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
    const [testNode] = this.getChildNodes();

    if (testNode?.path.node) {
      testNode.Traces.addDefaultTrace(testNode.path);
    }

    // set up branch data
    BranchStatement.createBranchStaticTrace(SyntaxType.While);

    const testTrace = testNode?.traceCfg;

    BranchStatement.insertPushTraceInFront();
    BranchStatement.setDecisionTrace(testTrace);
    BranchStatement.insertPopTraceBehind();
  }
}
