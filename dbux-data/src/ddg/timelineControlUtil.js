import PDGTimelineNodeType from '@dbux/common/src/types/constants/PDGTimelineNodeType';
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
} from './PDGTimelineNodes';

/** @typedef { import("./DataDependencyGraph").default } DataDependencyGraph */


/** ###########################################################################
 * 
 * ##########################################################################*/

export const syntaxToNodeType = {
  [SyntaxType.If]: PDGTimelineNodeType.If,
  [SyntaxType.Switch]: PDGTimelineNodeType.Switch,
  [SyntaxType.Ternary]: PDGTimelineNodeType.Ternary,

  [SyntaxType.For]: PDGTimelineNodeType.For,
  [SyntaxType.ForIn]: PDGTimelineNodeType.ForIn,
  [SyntaxType.ForOf]: PDGTimelineNodeType.ForOf,
  [SyntaxType.While]: PDGTimelineNodeType.While,
  [SyntaxType.DoWhile]: PDGTimelineNodeType.DoWhile
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
   * @param {DataDependencyGraph} pdg
   * @param {IfTimelineNode} ifNode 
   */
  [PDGTimelineNodeType.If](pdg, ifNode) {
    const {
      dp
    } = pdg;

    // compute label based on decision sequence
    const lastDecisionId = last(ifNode.decisions);
    let label;
    if (!lastDecisionId) {
      // something went wrong
      // label = '(ERR: no decision)';
      label = 'if';
    }
    else {
      const decisionNode = pdg.decisionTimelineNodes[lastDecisionId];
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
   * @param {DataDependencyGraph} pdg
   * @param {ForTimelineNode} forNode
   */
  [PDGTimelineNodeType.For](pdg, branchNode) {
    // const { dp } = pdg;

    return `for`;
  }
};