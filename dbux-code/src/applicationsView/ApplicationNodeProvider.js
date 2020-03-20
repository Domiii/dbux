import allApplications from 'dbux-data/src/applications/allApplications';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import ApplicationNode from './ApplicationNode';
import EmptyNode from './EmptyNode';

export default class ApplicationNodeProvider extends BaseTreeViewNodeProvider {
  constructor() {
    super('dbuxApplicationsView');
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    const roots = allApplications.getAll().map(this.buildApplicationNode).reverse();

    if (!roots.length) {
      roots.push(EmptyNode.instance);
    }

    return roots;
  }

  buildApplicationNode = (app) => {
    return this.buildNode(ApplicationNode, app);
  }
}
