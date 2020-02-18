import { TreeItemCollapsibleState } from 'vscode';
import BaseNode from './BaseNode';

export default class EmptyNode extends BaseNode {
  constructor() {
    super('(no trace at cursor)');

    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  // singleton
  static get instance() {
    return EmptyNode._instance = (EmptyNode._instance || new EmptyNode());
  }
}