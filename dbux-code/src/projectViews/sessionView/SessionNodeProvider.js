import BaseTreeViewNodeProvider from '../../codeUtil/treeView/BaseTreeViewNodeProvider';
import EmptyTreeViewNode from '../../codeUtil/treeView/EmptyNode';
import { getActionNodeClasses } from './ActionNodes';

/** @typedef {import('../projectViewsController').ProjectViewController} ProjectViewController */

export default class SessionNodeProvider extends BaseTreeViewNodeProvider {
  constructor(context, treeViewController) {
    super('dbuxSessionView');

    /**
     * @type {ProjectViewController}
     */
    this.controller = treeViewController;

    this.initDefaultClickCommand(context);
  }

  get manager() {
    return this.controller.manager;
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    const roots = [];

    if (this.manager.practiceSession) {
      const { exercise: bug } = this.manager.practiceSession;
      const ActionNodeClasses = getActionNodeClasses(bug);
      roots.push(...ActionNodeClasses.map(nodeClass => this.buildNode(nodeClass, bug, null)));
    }

    if (!roots.length) {
      roots.push(EmptyTreeViewNode.get('(No current practice session)'));
    }

    return roots;
  }
}
