import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { TreeItemCollapsibleState } from 'vscode';
import TraceDetailNode from '../traceDetailNode';
import EdgeAnalysisNode from './edgeAnalysis/EdgeAnalysisNode';
import DataDependenciesNode from './DataDependenciesNode';

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
    EdgeAnalysisNode,
    DataDependenciesNode,
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