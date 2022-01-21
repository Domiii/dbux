import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import TraceNode from '../../codeUtil/treeView/TraceNode';
import ContextNode from '../../codeUtil/treeView/ContextNode';
import DataNodeNode from '../../codeUtil/treeView/DataNodeNode';

const ResultNodeClassByMode = {
  [SearchMode.ByContext]: null,
  [SearchMode.ByTrace]: TraceNode,
  [SearchMode.ByValue]: DataNodeNode,
};

export default class SearchContextNode extends ContextNode {
  init() {
    this.contextValue = 'dbuxGlobalAnalysisView.node.searchContextNode';
  }

  canHaveChildren() {
    return !!ResultNodeClassByMode[this.mode];
  }

  buildChildren() {
    const ResultNodeClass = ResultNodeClassByMode[this.mode];
    if (ResultNodeClassByMode) {
      return this.matches.map(match => {
        return this.treeNodeProvider.buildNode(ResultNodeClass, match, this);
      });
    }
    else {
      return null;
    }
  }
}