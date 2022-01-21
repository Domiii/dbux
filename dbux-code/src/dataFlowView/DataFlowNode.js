import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeNode from '../codeUtil/treeView/DataNodeNode';


/**
 * Besides a `Trace`, this node also has a `dataNode` to specify one of it's dataNodes.
 * @property {DataNode} dataNode
 */
export default class DataFlowNode extends DataNodeNode {
  get clickUserActionType() {
    // TODO: add a new action type?
    return null;
  }

  init() {
    this.contextValue = 'dbuxDataFlowView.node.data';
  }

  getTraceDataNodes() {
    const { dp, trace: { traceId } } = this;
    return dp.util.getDataNodesOfTrace(traceId) || EmptyArray;
  }
}
