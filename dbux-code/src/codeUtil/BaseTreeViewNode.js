import { TreeItem } from 'vscode';

export default class BaseTreeViewNode extends TreeItem {
  application: Application;
  parent;
  children: BaseNode[] = null;

  constructor(treeDataProvider, label, entry, application, parent, moreProps) {
    super(label);

    this.entry = entry;
    this.treeDataProvider = treeDataProvider;
    this.application = application;
    this.parent = parent;

    // treeItem data
    // this.contextValue = this.constructor.name;

    // more custom props for this node
    Object.assign(this, moreProps);
  }

  makeIconPath() {

  }

  _handleClick() {
    // by default: do nothing
  }
}