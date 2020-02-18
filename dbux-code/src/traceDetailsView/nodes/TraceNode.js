import BaseNode from './BaseNode';
import { TreeItemCollapsibleState } from 'vscode';
import Trace from 'dbux-common/src/core/data/Trace';
import Application from 'dbux-data/src/applications/Application';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeTraceLabel, getTraceCreatedAt } from 'dbux-data/src/helpers/traceLabels';

export default class TraceNode extends BaseNode {
  init(trace) {
    this.trace = trace;
    this.collapsibleState = TreeItemCollapsibleState.None;

    // description
    // NOTE: description MUST be a string or it won't be properly displayed
    const dt = getTraceCreatedAt(trace.traceId, this.application);
    this.description = dt + '';
  }

  _handleClick() {
    traceSelection.selectTrace(this.trace);
  }

  static makeLabel(trace: Trace, application: Application) {
    return makeTraceLabel(trace, application);
  }

  static makeIconPath(trace: Trace) {
    return 'string.svg';
  }
}