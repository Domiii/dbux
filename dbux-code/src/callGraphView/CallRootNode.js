import { TreeItemCollapsibleState as CollapsibleState } from 'vscode';
import path from 'path';

export default class CallRootNode {
  constructor(
    displayName,
    applicationId,
    runId,
    contextId,
    traceId,
    children,
    callGraphNodeProvider
  ) {
    // node data
    this.applicationId = applicationId;
    this.runId = runId;
    this.contextId = contextId;
    this.traceId = traceId;
    this.callGraphNodeProvider = callGraphNodeProvider;

    // treeItem data
    this.label = displayName;
    this.parentNode = null;
    this.children = children;
    this.description = `Trace#${applicationId}:${traceId}`;
    this.collapsibleState = children?.length ? CollapsibleState.Collapsed : CollapsibleState.None;
    this.command = {
      command: 'dbuxCallGraphView.itemClick',
      arguments: [this]
    };
    this.contextValue = 'callRootNode';

    // TODO: fix icon path
    this.iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };
  }

  get tooltip() {
    return `${this.applicationId} ${this.runId} ${this.contextId} ${this.traceId} (tooltip)`;
  }
}

const EmptyNode = {
  label: '(no selected application)',
  collapsibleState: CollapsibleState.None
};

export { EmptyNode };