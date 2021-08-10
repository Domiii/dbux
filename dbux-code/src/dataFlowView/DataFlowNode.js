import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import TraceNode from '../traceDetailsView/nodes/TraceNode';


/**
 * Besides a `Trace`, this node also has a `dataNode` to specify one of it's dataNodes.
 * @property {DataNode} dataNode
 */
export default class DataFlowNode extends TraceNode {
  get clickUserActionType() {
    // TODO: add a new action type?
    return null;
  }

  init() {
    this.contextValue = 'dbuxDataFlowView.node.data';
  }

  makeIconPath() {
    return (traceSelection.isSelected(this.trace) && traceSelection.nodeId === this.nodeId) ? 'play.svg' : ' ';
  }

  handleClick() {
    traceSelection.selectTrace(this.trace, 'TraceNode', this.nodeId);
  }

  getTraceDataNodes() {
    const { dp, trace: { traceId } } = this;
    return dp.util.getDataNodesOfTrace(traceId) || EmptyArray;
  }
}
