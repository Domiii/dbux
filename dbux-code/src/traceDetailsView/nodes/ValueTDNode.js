import { TreeItemCollapsibleState } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { makeTreeItems } from '../../helpers/treeViewHelpers';

export default class ValueTDNode extends BaseTreeViewNode {

  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeProperties(trace, parent, detail) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;

    const value = dp.util.getTraceValue(trace.traceId);
    const label = `Value`;

    return {
      label,
      value
    };
  }

  get defaultCollapsibleState() {
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;

    if (!dp.util.isTracePlainObjectOrArray(traceId)) {
      return TreeItemCollapsibleState.None;
    }
    return TreeItemCollapsibleState.Collapsed;
  }

  init() {
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;

    if (!dp.util.isTracePlainObjectOrArray(traceId)) {
      this.description = dp.util.getTraceValueString(traceId);
    }
  }

  buildChildren() {
    const { value } = this;
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;

    if (!value) {
      return null;
    }

    if (!dp.util.isTracePlainObjectOrArray(traceId)) {
      return null;
    }

    return makeTreeItems(value);
  }
}