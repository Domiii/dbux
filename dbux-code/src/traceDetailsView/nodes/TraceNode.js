import Trace from 'dbux-common/src/core/data/Trace';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeTraceLabel, getTraceCreatedAt } from 'dbux-data/src/helpers/traceLabels';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

export default class TraceNode extends BaseTreeViewNode {
  static makeLabel(trace: Trace) {
    return makeTraceLabel(trace);
  }

  get trace() {
    return this.entry;
  }

  makeIconPath() {
    return traceSelection.isSelected(this.trace) ? 'play.svg' : ' ';
  }

  init() {
    // description
    // NOTE: description MUST be a string or it won't be properly displayed
    const dt = getTraceCreatedAt(this.trace);
    this.description = dt + '';
  }

  handleClick() {
    traceSelection.selectTrace(this.trace);
  }
}