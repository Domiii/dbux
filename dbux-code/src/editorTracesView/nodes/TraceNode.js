import { getTraceCreatedAt, makeTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import traceSelection from 'dbux-data/src/traceSelection';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

export default class TraceNode extends BaseTreeViewNode {
  /**
   * @override
   */
  static makeLabel(trace: Trace) {
    return makeTraceLabel(trace);
  }

  get trace() {
    return this.entry;
  }

  /**
   * @override
   */
  makeIconPath() {
    return traceSelection.isSelected(this.trace) ? 'play.svg' : ' ';
  }

  /**
   * @override
   */
  init() {
    const { trace } = this;

    // description
    // NOTE: description MUST be a string or it won't be properly displayed
    const dt = getTraceCreatedAt(trace);
    this.description = dt + '';
  }

  /**
   * @override
   */
  canHaveChildren() {
    return !!this.childTraces?.length;
  }

  /**
   * @override
   */
  handleClick() {
    traceSelection.selectTrace(this.trace);
  }

  /**
   * @override
   */
  buildChildren() {
    // add other traces as children (before details) 
    return this.childTraces?.map(
      other => this.treeNodeProvider.buildTraceNode(other, this));
  }
}