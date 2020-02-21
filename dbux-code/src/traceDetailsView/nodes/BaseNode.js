import { TreeItem } from 'vscode';
import Application from 'dbux-data/src/applications/Application';

export default class BaseNode extends TreeItem {
  application: Application;
  parent;
  children: BaseNode[] = null;

  constructor(treeDataProvider, label, iconPath, application, parent, id, moreProps) {
    super(label);

    this.treeDataProvider = treeDataProvider;
    this.application = application;
    this.parent = parent;
    this.id = id;

    // treeItem data
    // this.contextValue = 'detailsBaseNode';

    this.iconPath = iconPath;

    // more custom props for this node
    Object.assign(this, moreProps);
  }

  _handleClick() {
    // by default: do nothing
  }
}