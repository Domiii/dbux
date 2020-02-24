import { getTraceCreatedAt, makeTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import traceSelection from 'dbux-data/src/traceSelection';
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
    const { trace } = this;

    // description
    // NOTE: description MUST be a string or it won't be properly displayed
    const dt = getTraceCreatedAt(trace);
    this.description = dt + '';
  }

  canHaveChildren() {
    return !!this.childTraces?.length;
  }

  handleClick() {
    traceSelection.selectTrace(this.trace);
  }

  buildChildren() {
    // add other traces as children (before details) 
    return this.childTraces?.map(
      other => this.treeNodeProvider.buildTraceNode(other, this));
  }
}