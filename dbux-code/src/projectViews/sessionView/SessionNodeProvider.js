import EmptyNode from './EmptyNode';
import BaseTreeViewNodeProvider from '../../codeUtil/BaseTreeViewNodeProvider';
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
      roots.push(EmptyNode.instance);
    }

    return roots;
  }
}
