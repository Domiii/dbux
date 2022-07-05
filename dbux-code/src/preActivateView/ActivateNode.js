import { TreeItem, TreeItemCollapsibleState } from 'vscode';

/**
 * The "Activate Dbux" button calls `activate1`.
 */
export class ActivateNode extends TreeItem {
  constructor() {
    super('Start Dbux', TreeItemCollapsibleState.None);

    this.command = {
      command: 'dbux.doActivate1'
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