import {
  Uri,
  TreeItem,
  TreeItemCollapsibleState as CollapsibleState
} from 'vscode';
import path from 'path';
import { goToCodeLoc } from '../codeNav';

export default class ContextNode extends TreeItem {
  constructor(
    displayName,
    typeName,
    fileName,
    filePath,
    location,
    depth,
    applicationId,
    contextId,
    parentContextId = null,
    parentNode = null,
    treeNodeProvider
  ) {
    // set label
    super(`${displayName} [${typeName}]`);

    // node data
    this.displayName = displayName;
    this.typeName = typeName;
    this.fileName = fileName;
    this.filePath = filePath;
    this.location = location;
    this.depth = depth;
    this.applicationId = applicationId;
    this.contextId = contextId;
    this.parentContextId = parentContextId;
    this.parentNode = parentNode;
    this.treeNodeProvider = treeNodeProvider;

    // treeItem data
    this.children = [];
    this.description = `@${fileName}:${location.start.line}:${location.start.column}`;
    this.collapsibleState = CollapsibleState.None;
    this.command = {
      command: 'dbuxContextView.itemClick',
      arguments: [this]
    };
    this.contextValue = 'event';
    this.iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };
  }

  gotoCode = () => {
    goToCodeLoc(Uri.file(this.filePath), this.location);
  }

  pushChild = (child) => {
    this.children.push(child);
    this.collapsibleState = CollapsibleState.Collapsed;
  }

  expand = () => {
    this.collapsibleState = CollapsibleState.Expanded;
  }

  collapse = () => {
    this.collapsibleState = CollapsibleState.Collapsed;
  }

  get tooltip() {
    return `#${this.contextId} at ${this.fileName}(tooltip)`;
  }
}