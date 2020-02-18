import { TreeItemCollapsibleState } from 'vscode';
import path from 'path';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';

export default class CallStackNode {
  constructor(
    label,
    description,
    applicationId,
    traceId,
    callStackNodeProvider
  ) {
    // node data
    this.applicationId = applicationId;
    this.traceId = traceId;
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
    this.contextValue = 'callStackNode';

    // TODO: fix icon path
    this.iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };
  }

  get tooltip() {
    return `Trace#${this.applicationId}:${this.traceId}`;
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