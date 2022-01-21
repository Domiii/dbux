import allApplications from '@dbux/data/src/applications/allApplications';
import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import searchController from '../../search/searchController';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import SearchContextNode from './SearchContextNode';

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
    // group matches by context
    const matchesByContext = new Map();
    for (const { matches, applicationId } of searchController.matches) {
      const dp = allApplications.getById(applicationId).dataProvider;
      for (const match of matches) {
        const context = searchController.getContext(dp, match);
        if (!matchesByContext.get(context)) {
          matchesByContext.set(context, []);
        }
        matchesByContext.get(context).push(match);
      }
    }

    // build ContextNode
    const { mode } = searchController;
    return searchController.contexts.map(context => {
      return this.treeNodeProvider.buildNode(SearchContextNode, context, this, { matches: matchesByContext.get(context), mode });
    });
  }
}
