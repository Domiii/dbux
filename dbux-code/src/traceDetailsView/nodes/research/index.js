import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { TreeItemCollapsibleState } from 'vscode';
import TraceDetailNode from '../TraceDetailNode';
import EdgeAnalysisNode from './edgeAnalysis/EdgeAnalysisNode';
import DataDependenciesNode from './DataDependenciesNode';

class ResearchNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'Research';
  }

  static makeChildPropsDefault() {
    return {
      collapsibleState: TreeItemCollapsibleState.Expanded
    };
  }
  
  childClasses = [
    EdgeAnalysisNode,
  ];
}

export function makeResearchNodes() {
  if (!process.env.RESEARCH_ENABLED) {
    return EmptyArray;
  }

  return [
    ResearchNode
  ];
}