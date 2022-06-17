import DDGTimelineNodeType from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
import last from 'lodash/last';
import { 
  IfTimelineNode, 
  TernaryTimelineNode,
  SwitchTimelineNode,
  ForTimelineNode,
  ForInTimelineNode,
  ForOfTimelineNode,
  WhileTimelineNode,
  DoWhileTimelineNode
} from './DDGTimelineNodes';

/** @typedef { import("./DataDependencyGraph").default } DataDependencyGraph */


/** ###########################################################################
 * 
 * ##########################################################################*/

export const syntaxToNodeType = {
  [SyntaxType.If]: DDGTimelineNodeType.If,
  [SyntaxType.Switch]: DDGTimelineNodeType.Switch,
  [SyntaxType.Ternary]: DDGTimelineNodeType.Ternary,

  [SyntaxType.For]: DDGTimelineNodeType.For,
  [SyntaxType.ForIn]: DDGTimelineNodeType.ForIn,
  [SyntaxType.ForOf]: DDGTimelineNodeType.ForOf,
  [SyntaxType.While]: DDGTimelineNodeType.While,
  [SyntaxType.DoWhile]: DDGTimelineNodeType.DoWhile
};

export const branchSyntaxNodeCreators = {
  [SyntaxType.If]: IfTimelineNode,
  [SyntaxType.Switch]: SwitchTimelineNode,
  [SyntaxType.Ternary]: TernaryTimelineNode,
  [SyntaxType.For]: ForTimelineNode,
  [SyntaxType.ForIn]: ForInTimelineNode,
  [SyntaxType.ForOf]: ForOfTimelineNode,
  [SyntaxType.While]: WhileTimelineNode,
  [SyntaxType.DoWhile]: DoWhileTimelineNode,
};

/** ###########################################################################
 * {@link controlGroupLabelMaker}
 * ##########################################################################*/

export const controlGroupLabelMaker = {
  /**
   * @param {DataDependencyGraph} ddg
   * @param {IfTimelineNode} ifNode 
   */
  [DDGTimelineNodeType.If](ddg, ifNode) {
    const {
      dp
    } = ddg;

    // compute label based on decision sequence
    const lastDecisionId = last(ifNode.decisions);
    let label;
    if (!lastDecisionId) {
      // something went wrong
      // label = '(ERR: no decision)';
      label = 'if';
    }
    else {
      const decisionNode = ddg.decisionTimelineNodes[lastDecisionId];
      const isLastDecisionTruthy = dp.util.isDataNodeValueTruthy(decisionNode.dataNodeId);
      if (isLastDecisionTruthy) {
        if (ifNode.decisions.length === 1) {
          label = 'if';
        }
        else {
          label = 'else if';
        }
      }
      else {
        label = 'else';   // → falsy implies else
      }
    }
    return label;
  },

  /**
   * @param {DataDependencyGraph} ddg
   * @param {ForTimelineNode} forNode
   */
  [DDGTimelineNodeType.For](ddg, branchNode) {
    // const { dp } = ddg;

    return `for`;
  }
};