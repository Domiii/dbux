import { TreeItem } from 'vscode';

export default class BaseNode extends TreeItem {
  application: Application;
  parent;
  children: BaseNode[] = null;

  constructor(treeDataProvider, label, entry, application, parent, id, moreProps) {
    super(label);

    this.entry = entry;
    this.treeDataProvider = treeDataProvider;
    this.application = application;
    this.parent = parent;
    this.id = id;

    // treeItem data
    this.contextValue = 'detailsBaseNode';

    // more custom props for this node
    Object.assign(this, moreProps);
  }

  makeIconPath() {

  }

  _handleClick() {
    // by default: do nothing
  }
}