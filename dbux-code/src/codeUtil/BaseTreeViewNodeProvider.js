import { TreeItemCollapsibleState } from 'vscode';

export default class BaseTreeViewNodeProvider {
  idsCollapsibleState = new Map();

  generateId(nodeClassName, parent, i) {
    return [parent.id, nodeClassName, i].join('..');
  }


  buildRoots() {
    throw new Error('abstract method not implemented');
  }

  buildChildren(parent) {
    const children = parent.children = parent.buildChildren();
    const childIndexes = new Map();

    // assign ids
    children.forEach((child) => {
      // generate id
      const lastIdx = childIndexes.get(child.constructor) || 0;
      const index = lastIdx + 1;
      childIndexes.set(child.constructor, index);
      child.id = this.generateId(child.constructor.name, parent, index);
    });
  }

  buildNode(NodeClass, entry, application, parent, id, moreProps) {
    const label = NodeClass.makeLabel(entry, application, parent);
    const node = new NodeClass(this, label, entry, application, parent, id, moreProps);

    // iconPath
    const relativeIconPath = NodeClass.makeIconPath && NodeClass.makeIconPath(entry, application, parent);
    const iconPath = relativeIconPath && getThemeResourcePath(relativeIconPath) || null;
    node.iconPath = iconPath;

    // collapsibleState
    let collapsibleState = this.idsCollapsibleState.get(id);
    if (collapsibleState === undefined) {
      collapsibleState = node.canHaveChildren() ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None;
    }
    node.collapsibleState = collapsibleState;

    return node;
  }

  
  // ###########################################################################
  // overriding TreeDataProvider
  // ###########################################################################

  getTreeItem = (node) => {
    return node;
  }

  getChildren = (node) => {
    if (node) {
      if (node.children) {
        return node.children;
      }
      if (node.canHaveChildren()) {
        return this.buildChildren(node);
      }
    }
    else {
      return this.rootNodes;
    }
  }

  getParent = (node) => {
    return node.parent;
  }
}