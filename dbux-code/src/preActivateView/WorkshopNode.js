import { TreeItem, TreeItemCollapsibleState } from 'vscode';

export default class WorkshopNode extends TreeItem {
  constructor() {
    super('Start Dbux', TreeItemCollapsibleState.None);

    this.command = {
      command: 'dbux.doWorkshopActivate'
    };
  }

  makeIconPath() {
    return 'play.svg';
  }

  // singleton
  static get instance() {
    return WorkshopNode._instance = (WorkshopNode._instance || new WorkshopNode());
  }
}