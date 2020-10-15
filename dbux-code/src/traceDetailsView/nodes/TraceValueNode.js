import Trace from '@dbux/common/src/core/data/Trace';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeTraceValueLabel } from '@dbux/data/src/helpers/traceLabels';
import { valueRender } from '../valueRender';
import { emitPracticeSelectTraceAction } from '../../userEvents';
import TraceNode from './TraceNode';

export default class TraceValueNode extends TraceNode {
  get value() {
    const { trace: { applicationId, traceId } } = this;
    const dp = allApplications.getById(applicationId).dataProvider;
    return dp.util.getTraceValue(traceId);
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
    emitPracticeSelectTraceAction('selectNearbyTrace', this.trace);
    traceSelection.selectTrace(this.trace);
  }

  valueRender() {
    const { valueRef, value } = this;
    valueRender(valueRef, value);
  }
}