import DDGTimelineNodeType from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
import last from 'lodash/last';
import DataDependencyGraph from './DataDependencyGraph';
import { IfTimelineNode } from './DDGTimelineNodes';

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
  [SyntaxType.If](...args) { return new IfTimelineNode(...args); },
  [SyntaxType.Switch](...args) { return new SwitchTimelineNode(...args); },
  [SyntaxType.Ternary](...args) { return new TernaryTimelineNode(...args); },
  [SyntaxType.For](...args) { return new ForTimelineNode(...args); },
  [SyntaxType.ForIn](...args) { return new ForInTimelineNode(...args); },
  [SyntaxType.ForOf](...args) { return new ForOfTimelineNode(...args); },
  [SyntaxType.While](...args) { return new WhileTimelineNode(...args); },
  [SyntaxType.DoWhile](...args) { return new DoWhileTimelineNode(...args); }
};

/** ###########################################################################
 * {@link branchLabelMaker}
 * ##########################################################################*/

export const branchLabelMaker = {
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
      label = '(ERR: no decision)';
    }
    else {
      const decisionNode = ddg.getDataTimelineNode(lastDecisionId);
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
  }
};