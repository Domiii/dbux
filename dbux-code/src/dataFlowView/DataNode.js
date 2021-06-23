import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import TraceNode from '../traceDetailsView/nodes/TraceNode';

/**
 * Besides a `Trace`, this node also has a `nodeId` to specify one of it's dataNodes.
 * @property {number} nodeId
 */
export default class DataNode extends TraceNode {
  get clickUserActionType() {
    // TODO: add a new action type?
    return null;
  }

  get dataNode() {
    return this.entry
  }
  
  makeIconPath() {
    return (traceSelection.isSelected(this.trace) && traceSelection.nodeId === this.nodeId) ? 'play.svg' : ' ';
  }

  handleClick() {
    traceSelection.selectTrace(this.trace, 'TraceNode', this.nodeId);
    console.log(`Selecting trace#${this.trace.traceId}, node#${this.nodeId}`);
  }

  getTraceDataNodes() {
    const { applicationId, traceId } = this.trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    return dp.indexes.dataNodes.byTrace.get(traceId) || EmptyArray;
  }
}
