import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import makeTreeItem from '../../helpers/makeTreeItem';
import TraceNode from '../../traceDetailsView/nodes/TraceNode';


/** ###########################################################################
 * {@link ConsoleNode}
 * ##########################################################################*/

class ConsoleTraceNode extends TraceNode {

}

/**
 * TODO: use TraceContainerNode
 */
export default class ConsoleNode extends BaseTreeViewNode {
  static makeLabel(/*app, parent*/) {
    return `Console`;
  }

  get collapseChangeUserActionType() {
    return UserActionType.GlobalDebugAppUse;
  }

  init() {
    const n = allApplications.selection.data.countStats((dp) => {
      return dp.indexes.traces.byPurpose.getSize(TracePurpose.Console);
    });
    this.description = `(${n})`;
  }

  buildChildren() {
    return allApplications.selection.data.collectGlobalStats((dp, app) => {
      return dp.indexes.traces.byPurpose.get(TracePurpose.Console)
        .map(trace => {
          return this.treeNodeProvider.buildNode(ConsoleTraceNode, trace, this);
        });
    });
  }
}