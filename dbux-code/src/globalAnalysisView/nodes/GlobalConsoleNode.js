import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import { makeTraceLabel, makeTraceLocLabel } from '@dbux/data/src/helpers/makeLabels';
import { makeShortString } from '@dbux/common/src/util/stringUtil';
import TraceNode from '../../codeUtil/treeView/TraceNode';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';



/** ###########################################################################
 * {@link ConsoleTraceNode}
 * ##########################################################################*/

class ConsoleTraceNode extends TraceNode {
  static makeLabel(trace, parent, { consoleMessage }) {
    return makeShortString(consoleMessage);
  }

  init() {
    const { trace } = this;
    const traceLabel = makeTraceLabel(trace);
    const loc = makeTraceLocLabel(this.trace);
    this.description = `${traceLabel} (${loc})`;
    this.tooltip = `${this.consoleMessage}\n\n---------------\n  > ${traceLabel}\n  at ${loc}`;
  }
}


/** ###########################################################################
 * {@link GlobalConsoleNode}
 *  #########################################################################*/

/**
 * TODO: use TraceContainerNode
 */
export default class GlobalConsoleNode extends BaseTreeViewNode {
  static makeLabel(/*app, parent*/) {
    return `Console`;
  }

  get collapseChangeUserActionType() {
    return UserActionType.GlobalConsoleUse;
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
        ?.map(trace => {
          const consoleMessage = dp.util.renderConsoleMessage(trace.traceId);
          return this.treeNodeProvider.buildNode(ConsoleTraceNode, trace, this, { consoleMessage });
        });
    });
  }
}
