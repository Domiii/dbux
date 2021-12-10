import allApplications from '@dbux/data/src/applications/allApplications';
import BaseTreeViewNodeProvider from '../codeUtil/treeView/BaseTreeViewNodeProvider';
import EmptyTreeViewNode from '../codeUtil/treeView/EmptyNode';
import ApplicationNode from './ApplicationNode';

export default class ApplicationNodeProvider extends BaseTreeViewNodeProvider {
  constructor() {
    super('dbuxApplicationsView');
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    const appByPath = {};
    for (const app of allApplications.getAll()) {
      const entry = app.entryPointPath;
      if (!appByPath[entry]) appByPath[entry] = [];
      appByPath[entry].push(this.buildApplicationNode(app));
    }

    const roots = [];
    for (let [entry, apps] of Object.entries(appByPath)) {
      const newRoot = apps.slice(-1)[0];
      const children = apps.slice(0, -1).reverse();
      newRoot.children = children.length ? children : null;
      newRoot.tooltip = entry;
      roots.push(newRoot);
    }

    if (!roots.length) {
      roots.push(EmptyTreeViewNode.get('(no applications)'));
    }

    return roots.reverse();
  }

  buildApplicationNode = (app) => {
    return this.buildNode(ApplicationNode, app);
  }
}
