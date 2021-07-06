import { TreeItemCollapsibleState, TreeItem } from 'vscode';

export default class EmptyDataNode extends TreeItem {
  constructor() {
    super('');
    
    this.description = '(trace has no value)';
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  // singleton
  static get instance() {
    return EmptyDataNode._instance = (EmptyDataNode._instance || new EmptyDataNode());
  }
}