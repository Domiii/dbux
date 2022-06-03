import BaseTreeViewNodeProvider from '../codeUtil/treeView/BaseTreeViewNodeProvider';
import { ToolNodeClasses } from './ToolNodes';
import ChapterListNode from './ChapterListNode';

/** @typedef {import('./ChapterListBuilderViewController').default} ChapterListBuilderViewController */

export default class ChapterListBuilderNodeProvider extends BaseTreeViewNodeProvider {
  /**
   * 
   * @param {ChapterListBuilderViewController} treeViewController 
   */
  constructor(treeViewController) {
    super('dbuxChapterListBuilderView');
    this.controller = treeViewController;
  }

  buildRoots() {
    const roots = [];

    roots.push(...ToolNodeClasses.map(nodeClass => this.buildNode(nodeClass, null, null)));

    if (this.controller.chapters) {
      roots.push(this.buildNode(ChapterListNode, this.controller.chapters, null));
    }

    return roots;
  }
}
