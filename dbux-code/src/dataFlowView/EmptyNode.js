import { TreeItemCollapsibleState, TreeItem } from 'vscode';

export default class EmptyNode extends TreeItem {
  constructor() {
    super('');
    
    this.description = '(no trace selected)';
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  // singleton
  static get instance() {
    return EmptyNode._instance = (EmptyNode._instance || new EmptyNode());
  }
}