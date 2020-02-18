import {
  TreeItemCollapsibleState as CollapsibleState
} from 'vscode';
import path from 'path';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';

export default class ContextNode {
  constructor(
    displayName,
    applicationId,
    runId,
    contextId,
    traceId,
    contextNodeProvider
  ) {
    // node data
    this.applicationId = applicationId;
    this.runId = runId;
    this.contextId = contextId;
    this.traceId = traceId;
    this.contextNodeProvider = contextNodeProvider;

    // treeItem data
    this.label = displayName;
    this.parentNode = null;
    this.children = EmptyArray;
    this.description = `Click to jump to trace#${traceId}`;
    this.collapsibleState = CollapsibleState.None;
    this.command = {
      command: 'dbuxContextView.itemClick',
      arguments: [this]
    };
    this.contextValue = 'contextNode';

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
}

export { EmptyNode };