import { TreeItemCollapsibleState } from 'vscode';
import path from 'path';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import traceSelection from 'dbux-data/src/traceSelection';
import allApplications from 'dbux-data/src/applications/allApplications';
import { makeTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';

export default class CallStackNode {
  constructor(
    trace,
    searchMode,
    parentStatus,
    callStackNodeProvider
  ) {
    // node data
    this.trace = trace;
    this.searchMode = searchMode;
    this.parentStatus = parentStatus;
    this.callStackNodeProvider = callStackNodeProvider;

    // treeItem data
    this.label = makeTraceLabel(trace);
    this.description = this._makeDescription(trace);
    this.tooltip = `Trace#${this.trace.applicationId}:${this.trace.traceId}`;
    this.parentNode = null;
    this.children = EmptyArray;
    this.collapsibleState = TreeItemCollapsibleState.None;
    this.command = {
      command: 'dbuxCallStackView.itemClick',
      arguments: [this]
    };    

    // TODO: fix icon path
    if (traceSelection.isSelected(trace)) {
      this.iconPath = {
        light: path.join(__dirname, '..', '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__dirname, '..', '..', '..', 'resources', 'dark', 'dependency.svg')
      };
    }
    else {
      this.iconPath = ' ';
    }
  }

  get contextValue() {
    return `callStackNode.${this.parentStatus}.${this.searchMode}`;
  }

  _makeDescription(trace) {
    const { applicationId, traceId, staticTraceId } = trace;
    const app = allApplications.getById(applicationId);
    const dp = app.dataProvider;
    const context = dp.collections.executionContexts.getById(trace.contextId);
    const contextLabel = makeContextLabel(context, app);
    const fileName = dp.util.getTraceFileName(traceId);
    const { loc } = dp.collections.staticTraces.getById(staticTraceId);
    const { line, column } = loc.start;
    return `${contextLabel} @${fileName}:${line}:${column}`;
  }
}

const EmptyNode = {
  label: '(no app running)',
  collapsibleState: TreeItemCollapsibleState.None
};

const BarrierNode = {
  label: '',
  description: '--------------------',
  collapsibleState: TreeItemCollapsibleState.None
};

export { EmptyNode, BarrierNode };