import { TreeItemCollapsibleState, TreeItem } from 'vscode';

export default class EmptyValueNode extends TreeItem {
  constructor() {
    super('');

    this.description = '(no properties)';
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  // singleton
  static get instance() {
    return EmptyValueNode._instance = (EmptyValueNode._instance || new EmptyValueNode());
  }
}