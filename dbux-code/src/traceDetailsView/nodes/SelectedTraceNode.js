import Trace from '@dbux/common/src/types/Trace';
import TraceNode from '../../codeUtil/treeView/TraceNode';

export default class SelectedTraceNode extends TraceNode {
  /**
   * @param {Trace} trace 
   */
  static makeLabel(trace) {
    const label = TraceNode.makeLabel(trace);

    return `${label}`;
  }

  get trace() {
    return this.entry;
  }

  makeIconPath() {
    return 'play.svg';
  }
}