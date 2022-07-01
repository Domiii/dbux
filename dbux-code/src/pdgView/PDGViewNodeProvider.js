import BaseTreeViewNodeProvider from '../codeUtil/treeView/BaseTreeViewNodeProvider';
import ToolRootNode from './ToolNodes';
import ChapterListNode from './ChapterListNode';

/** @typedef {import('./pDGViewController').default} PDGViewController */

export default class PDGViewNodeProvider extends BaseTreeViewNodeProvider {
  /**
   * 
   * @param {PDGViewController} treeViewController 
   */
  constructor(treeViewController) {
    super('dbuxChapterListBuilderView');
    this.controller = treeViewController;
  }

  get manager() {
    return this.controller.manager;
  }

  buildRoots() {
    const roots = [];

    if (process.env.NODE_ENV === 'development') {
      roots.push(this.buildNode(ToolRootNode));
    }

    if (this.controller.chapters) {
      roots.push(this.buildNode(ChapterListNode, this.controller.chapters, null));
    }

    return roots;
  }
}
