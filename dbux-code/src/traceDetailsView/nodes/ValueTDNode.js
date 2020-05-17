import { TreeItemCollapsibleState } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { makeTreeItems, makeTreeChildren } from '../../helpers/treeViewHelpers';
import ValueTypeCategory from 'dbux-common/src/core/constants/ValueTypeCategory';

export default class ValueTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeLabel(trace, parent) {
    return 'Value';
  }

  static makeProperties(trace, parent, detail) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;

    const value = dp.util.getTraceValue(trace.traceId);

    return {
      value
    };
  }

  canHaveChildren() {
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;

    return dp.util.isTracePlainObjectOrArrayValue(traceId);
  }

  init() {
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;

    if (!dp.util.isTracePlainObjectOrArrayValue(traceId)) {
      this.description = dp.util.getTraceValueString(traceId);
    }
    else {
      const valueRef = dp.util.getTraceValueRef(traceId);
      this.description = ValueTypeCategory.nameFrom(valueRef.category);
    }
  }

  buildChildren() {
    const { value } = this;
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;

    if (!value) {
      return null;
    }

    if (!dp.util.isTracePlainObjectOrArrayValue(traceId)) {
      return null;
    }

    return makeTreeChildren(value);
  }
}