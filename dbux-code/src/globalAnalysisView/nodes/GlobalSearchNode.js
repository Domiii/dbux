import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import searchController from '../../search/searchController';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import ContextNode from '../../codeUtil/treeView/ContextNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

const DescriptionByMode = {
  [SearchMode.ByContext]: 'byContext',
  [SearchMode.ByTrace]: 'byTrace',
  [SearchMode.ByValue]: 'byValue',
};

/** ###########################################################################
 * {@link GlobalSearchNode}
 * ##########################################################################*/

export default class GlobalSearchNode extends BaseTreeViewNode {
  static makeLabel(entry, parent, moreProps, provider) {
    return `Search(${searchController.contexts.length})`;
  }

  init() {
    if (searchController.mode !== SearchMode.None) {
      this.description = `(${DescriptionByMode[searchController.mode]})`;
    }
    else {
      this.description = '';
    }
  }

  buildChildren() {
    return searchController.contexts.map(context => {
      return this.treeNodeProvider.buildNode(ContextNode, context, this);
    });
  }
}
