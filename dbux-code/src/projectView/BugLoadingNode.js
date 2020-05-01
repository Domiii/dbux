import { TreeItemCollapsibleState, TreeItem } from 'vscode';

export default class BugLoadingNode extends TreeItem {
  constructor() {
    super('(loading...)');

    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  // singleton
  static get instance() {
    return BugLoadingNode._instance = (BugLoadingNode._instance || new BugLoadingNode());
  }
}