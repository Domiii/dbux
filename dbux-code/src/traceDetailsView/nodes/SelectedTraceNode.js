import { TreeItemCollapsibleState } from 'vscode';
import Trace from 'dbux-common/src/core/data/Trace';
import Application from 'dbux-data/src/applications/Application';
import TraceNode from './TraceNode';

export default class SelectedTraceNode extends TraceNode {
  init(trace) {
    super.init(trace);

    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  static makeLabel(trace: Trace, application: Application) {
    const label = TraceNode.makeLabel(trace, application);

    return `${label}`;
  }

  static makeIconPath(trace: Trace) {
    return 'play.svg';
  }
}