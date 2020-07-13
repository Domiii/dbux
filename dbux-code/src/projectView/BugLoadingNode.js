import { TreeItemCollapsibleState, TreeItem } from 'vscode';

export default class BugLoadingNode extends TreeItem {
  constructor() {
    super('(loading...)', TreeItemCollapsibleState.None);
  }
}