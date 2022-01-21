import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import DataFlowNode from '../../dataFlowView/DataFlowNode';
import TraceNode from '../../codeUtil/treeView/TraceNode';
import ContextNode from '../../codeUtil/treeView/ContextNode';

const ResultNodeClassByMode = {
  [SearchMode.ByContext]: null,
  [SearchMode.ByTrace]: TraceNode,
  [SearchMode.ByValue]: DataFlowNode,
};

export default class SearchContextNode extends ContextNode {
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