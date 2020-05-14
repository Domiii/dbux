import { TreeItemCollapsibleState, window } from 'vscode';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import allApplications from 'dbux-data/src/applications/allApplications';
import objectTracker from 'dbux-data/src/objectTracker';

import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

export default class TrackObjectTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeProperties(trace, parent, detail) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;

    const { valueId } = trace;
    let trackedTraces = EmptyArray;
    if (valueId) {
      const { trackId } = dp.collections.values.getById(valueId);
      if (trackId) {
        trackedTraces = dp.indexes.traces.byTrackId.get(trackId);
      }
    }

    const label = `${trackedTraces.length}x tracked traces`;

    return {
      trackedTraces,
      label
    };
  }

  static makeLabel(trace, parent, props) {
    return props.label;
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Expanded;
  }

  init() {
    const { applicationId, traceId } = this.trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    if (dp.util.isTraceRealObject(traceId)) {
      this.contextValue = 'dbuxTraceDetailsView.traceObjectTDNodeRoot.withObjectValue';
    }
  }
  
  selectObject() {
    objectTracker.selectTrace(this.trace);
  }


  buildChildren() {
    const { trackedTraces, treeNodeProvider } = this;

    const children = trackedTraces.map(t => treeNodeProvider.buildTraceNode(t, this));
    return children;
  }
}