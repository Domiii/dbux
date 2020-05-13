import { TreeItemCollapsibleState } from 'vscode';
import Trace from 'dbux-common/src/core/data/Trace';
import TraceNode from './TraceNode';

export default class SelectedTraceNode extends TraceNode {
  static makeLabel(trace: Trace) {
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