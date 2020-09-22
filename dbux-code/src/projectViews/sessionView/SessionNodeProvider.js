import EmptyNode from './EmptyNode';
import BaseTreeViewNodeProvider from '../../codeUtil/BaseTreeViewNodeProvider';
import { ActionNodeClasses } from './ActionNodes';

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
      const { bug } = this.manager.practiceSession;
      roots.push(...ActionNodeClasses.map(nodeClass => this.buildNode(nodeClass, bug, this)));
    }

    if (!roots.length) {
      roots.push(EmptyNode.instance);
    }

    return roots;
  }
}
