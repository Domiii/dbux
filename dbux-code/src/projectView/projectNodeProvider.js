import allApplications from 'dbux-data/src/applications/allApplications';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import ProjectNode from './ProjectNode';
import EmptyNode from './EmptyNode';

export default class ProjectNodeProvider extends BaseTreeViewNodeProvider {
  constructor(context, treeViewController) {
    super('dbuxProjectView');
    this.controller = treeViewController;

    this.initDefaultClickCommand(context);
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    const appByPath = {};
    for (const app of allApplications.getAll()) {
      const entry = app.entryPointPath;
      if (!appByPath[entry]) appByPath[entry] = [];
      appByPath[entry].push(this.buildProjectNode(app));
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
      roots.push(EmptyNode.instance);
    }

    return roots.reverse();
  }

  buildProjectNode = (app) => {
    return this.buildNode(ProjectNode, app);
  }
}
