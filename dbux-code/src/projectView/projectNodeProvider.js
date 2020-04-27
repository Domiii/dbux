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
    const roots = [];

    for (let project of this.controller.manager.projects) {
      const node = this.buildProjectNode(project);
      roots.push(node);
    }

    if (!roots.length) {
      roots.push(EmptyNode.instance);
    }

    return roots.reverse();
  }

  buildProjectNode = (project) => {
    return this.buildNode(ProjectNode, project);
  }
}
