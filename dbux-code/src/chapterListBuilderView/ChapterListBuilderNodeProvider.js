import BaseTreeViewNodeProvider from '../codeUtil/treeView/BaseTreeViewNodeProvider';
import { ToolNodeClasses } from './ToolNodes';

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

    return roots.reverse();
  }
}
