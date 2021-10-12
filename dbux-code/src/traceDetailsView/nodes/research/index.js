import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { TreeItemCollapsibleState } from 'vscode';
import TraceDetailNode from '../traceDetailNode';
import EdgeAnalysisNode from './edgeAnalysis/EdgeAnalysisNode';

class ResearchNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'Research';
  }

  makeChildPropsDefault() {
    return {
      collapsibleState: TreeItemCollapsibleState.Expanded
    };
  }
  
  childClasses = [
    EdgeAnalysisNode
  ];
}

export function makeResearchNodes() {
  if (!process.env.RESEARCH) {
    return EmptyArray;
  }

  return [
    ResearchNode
  ];
}