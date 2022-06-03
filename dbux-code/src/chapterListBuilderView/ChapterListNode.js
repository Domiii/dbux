import ChapterNode from '../projectViews/practiceView/ChapterNode';
import BaseTreeViewNode from '../codeUtil/treeView/BaseTreeViewNode'

export default class ChapterListNode extends BaseTreeViewNode {
  static makeLabel() {
    return 'Chapters';
  }

  buildChildren(en) {
    return this.entry.map(chapter => this.treeNodeProvider.buildNode(ChapterNode, chapter, this));
  }
}
