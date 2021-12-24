import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import makeTreeItem from '../../helpers/makeTreeItem';


/** ###########################################################################
 * {@link ConsoleNode}
 * ##########################################################################*/


export default class ConsoleNode extends BaseTreeViewNode {
  static makeLabel(/*app, parent*/) {
    return `Console`;
  }

  get collapseChangeUserActionType() {
    return UserActionType.GlobalDebugAppUse;
  }

  init() {
    const n = allApplications.selection.data.collectGlobalStats((dp, app) => {
    });
    this.description = `${}`;
  }

  buildChildren() {
    return allApplications.selection.data.collectGlobalStats((dp, app) => {
      return dp.collections.asyncNodes.getAllActual()
        .filter(asyncNode => !!asyncNode.syncPromiseIds?.length)
        .map(asyncNode => {
          const rootId = asyncNode.rootContextId;
          const rootContext = dp.collections.executionContexts.getById(rootId);
          return makeTreeItem(
            makeContextLabel(rootContext, app), // makeContextLocLabel()
            asyncNode,
            {
              description: `${makeContextLocLabel(app.applicationId, rootContext)}`,
              handleClick() {
                // -> go to first trace in edge's toRoot
                const targetTrace = dp.util.getFirstTraceOfContext(rootId);
                if (targetTrace) {
                  traceSelection.selectTrace(targetTrace);
                }
              }
            }
          );
        });
    });
  }
}