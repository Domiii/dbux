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

    const trackedTraces = dp.util.getAllTracesOfObjectOfTrace(trace.traceId);

    const label = `Object traces`;

    return {
      trackedTraces,
      label
    };
  }

  static makeLabel(trace, parent, props) {
    return props.label;
  }

  get defaultCollapsibleState() {
    if (!this.trackedTraces) {
      return TreeItemCollapsibleState.None;
    }
    return TreeItemCollapsibleState.Collapsed;
  }

  init() {
    const { 
      trace: {
        applicationId, traceId
      },
      trackedTraces
    } = this;

    const dp = allApplications.getById(applicationId).dataProvider;

    if (!dp.util.doesTraceHaveValue(traceId)) {
      this.description = '(trace has no value)';
    }
    else if (!dp.util.isTraceRealObject(traceId)) {
      this.description = '(trace\'s value is not an object/array/function)';
    }
    else {
      this.contextValue = 'dbuxTraceDetailsView.traceObjectTDNodeRoot.withObjectValue';
      this.description = `${trackedTraces.length}x`;
    }
  }
  
  selectObject() {
    objectTracker.selectTrace(this.trace);
  }


  buildChildren() {
    const { trackedTraces, treeNodeProvider } = this;

    if (!trackedTraces) {
      return null;
    }

    const children = trackedTraces.map(t => treeNodeProvider.buildTraceNode(t, this));
    return children;
  }
}