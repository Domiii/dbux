import { getTraceCreatedAt, makeTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import traceSelection from 'dbux-data/src/traceSelection';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

export default class TraceNode extends BaseTreeViewNode {
  init() {
    const trace = this.entry;

    // description
    // NOTE: description MUST be a string or it won't be properly displayed
    const dt = getTraceCreatedAt(trace.traceId, this.application);
    this.description = dt + '';
  }

  canHaveChildren() {
    return !!this.children?.length;
  }

  handleClick() {
    traceSelection.selectTrace(this.trace);
  }

  static makeLabel(trace: Trace, application: Application) {
    return makeTraceLabel(trace, application);
  }

  static makeIconPath(trace: Trace) {
    return traceSelection.isSelected(trace) ? 'play.svg' : ' ';
  }
}