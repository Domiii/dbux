import TraceNode from '../traceDetailsView/nodes/TraceNode';

export default class DataNode extends TraceNode {
  get clickUserActionType() {
    // TODO: add a new action type?
    return UserActionType.TDTraceUse;
  }
}