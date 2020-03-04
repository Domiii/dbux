import { TreeItemCollapsibleState, TreeItem } from 'vscode';

export default class EmptyNode extends TreeItem {
  constructor() {
    super('(no application now)');

    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  // singleton
  static get instance() {
    return EmptyNode._instance = (EmptyNode._instance || new EmptyNode());
  }
}