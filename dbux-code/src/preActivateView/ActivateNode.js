import { TreeItem, TreeItemCollapsibleState } from 'vscode';

export class ActivateNode extends TreeItem {
  constructor() {
    super('Start Dbux', TreeItemCollapsibleState.None);

    this.command = {
      command: 'dbux.doActivate'
    };
  }

  makeIconPath() {
    return 'play.svg';
  }

  // singleton
  static get instance() {
    return ActivateNode._instance = (ActivateNode._instance || new ActivateNode());
  }
}