import Trace from '@dbux/common/src/core/data/Trace';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeTraceValueLabel } from '@dbux/data/src/helpers/traceLabels';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { valueRender } from '../valueRender';

export default class TraceValueNode extends BaseTreeViewNode {
  /**
   * @param {Trace} 
   */
  static makeLabel(trace) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const label = dp.collections.staticTraces.getById(trace.staticTraceId);
    return label;
  }

  get trace() {
    return this.entry;
  }

  get valueRef() {
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;
    return dp.util.getTraceValueRef(traceId);
  }

  init() {
    this.contextValue = 'dbuxTraceDetailsView.node.traceValueNode';
    this.description = makeTraceValueLabel(this.trace);
  }

  makeIconPath() {
    return traceSelection.isSelected(this.trace) ? 'play.svg' : ' ';
  }

  handleClick() {
    traceSelection.selectTrace(this.trace);
  }

  valueRender() {
    const { valueRef, value } = this;
    valueRender(valueRef, value);
  }
}