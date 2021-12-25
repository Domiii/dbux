import allApplications from '@dbux/data/src/applications/allApplications';
import BaseTreeViewNodeProvider from '../codeUtil/treeView/BaseTreeViewNodeProvider';
import EmptyTreeViewNode from '../codeUtil/treeView/EmptyNode';
import GlobalNodeClasses from './nodes';

export default class GlobalAnalysisNodeProvider extends BaseTreeViewNodeProvider {
  constructor() {
    super('dbuxGlobalAnalysisView');
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    const roots = [];

    if (allApplications.selection.getAll().length) {
      roots.push(
        ...this.buildGlobalNodes()
      );
    }
    else {
      roots.push(EmptyTreeViewNode.get('(no applications)'));
    }

    return roots;
  }

  buildGlobalNodes() {
    return GlobalNodeClasses
      .map(NodeClass => this.buildNode(NodeClass, null, null))
      .filter(node => !!node);
  }
}