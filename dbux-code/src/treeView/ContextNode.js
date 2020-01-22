import { navToCode } from '../codeControl/codeNav';
import { getCodePositionFromLoc } from '../util/codeUtil';
import path from 'path';
import {
  Uri,
  TreeItem, 
  TreeItemCollapsibleState as CollapsibleState 
} from 'vscode';

export default class ContextNode extends TreeItem {

	constructor(
    displayName,
    typeName,
    fileName,
    filePath,
    location,
    depth,
    contextId,
    parentContextId = null,
    parentNode = null,
    nodeProvider
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
    this.contextId = contextId;
    this.parentContextId = parentContextId;
    this.parentNode = parentNode;
    this.nodeProvider = nodeProvider;

    // treeItem data
    this.children = [];
    this.description = `@${fileName}:${location.start.line}:${location.start.column}`;
    this.collapsibleState = CollapsibleState.None;
    this.command = {
      command: 'dbuxEvents.itemClick',
      arguments: [this]
    };
    this.contextValue = 'event';
    this.iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };
  }

  gotoCode = () => {
    navToCode(Uri.file(this.filePath), getCodePositionFromLoc(this.location.start));
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