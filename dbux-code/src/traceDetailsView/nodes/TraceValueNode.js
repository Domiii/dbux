import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeTraceValueLabel } from '@dbux/data/src/helpers/makeLabels';
import { valueRender } from '../valueRender';
import TraceNode from './TraceNode';

/**
 * Children of `NearbyValuesTDNode`
 * @deprecated `dp.util.getTraceValue` does not work now
 */
export default class TraceValueNode extends TraceNode {
  get value() {
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;
    return dp.util.getTraceValuePrimitive(traceId);
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

  canHaveChildren() {
    return !!this.children?.length;
  }

  handleClick() {
    traceSelection.selectTrace(this.trace);
  }

  valueRender() {
    const { valueRef, value } = this;
    valueRender(valueRef, value);
  }
}