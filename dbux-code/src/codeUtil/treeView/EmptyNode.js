import { TreeItemCollapsibleState, TreeItem } from 'vscode';

export default class EmptyTreeViewNode extends TreeItem {
  constructor(label, description) {
    super(label, TreeItemCollapsibleState.None);

    this.description = description;
  }

  /**
   * @param {string} label 
   * @param {string} description 
   * @returns {TreeItem}
   */
  static get(description, label = '') {
    if (!EmptyTreeViewNode._instances[label]) {
      EmptyTreeViewNode._instances[label] = {};
    }
    if (!EmptyTreeViewNode._instances[label][description]) {
      EmptyTreeViewNode._instances[label][description] = new EmptyTreeViewNode(label, description);
    }
    return EmptyTreeViewNode._instances[label][description];
  }

  static _instances = {};
}