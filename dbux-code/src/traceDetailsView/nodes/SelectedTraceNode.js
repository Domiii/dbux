import { TreeItemCollapsibleState } from 'vscode';
import Trace from 'dbux-common/src/core/data/Trace';
import Application from 'dbux-data/src/applications/Application';
import TraceNode from './TraceNode';

export default class SelectedTraceNode extends TraceNode {
  static makeLabel(trace: Trace, application: Application) {
    const label = TraceNode.makeLabel(trace, application);

    return `${label}`;
  }

  get trace() {
    return this.entry;
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Expanded;
  }

  makeIconPath() {
    return 'play.svg';
  }
}