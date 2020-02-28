import { TreeItemCollapsibleState } from 'vscode';
import path from 'path';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import traceSelection from 'dbux-data/src/traceSelection';

export default class CallStackNode {
  constructor(
    label,
    description,
    applicationId,
    trace,
    searchMode,
    parentStatus,
    callStackNodeProvider
  ) {
    // node data
    this.applicationId = applicationId;
    this.trace = trace;
    this.searchMode = searchMode;
    this.parentStatus = parentStatus;
    this.callStackNodeProvider = callStackNodeProvider;

    // treeItem data
    this.label = label;
    this.description = description;
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

  get tooltip() {
    return `Trace#${this.applicationId}:${this.trace.traceId}`;
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