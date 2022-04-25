import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import { makeTraceLabel, makeTraceLocLabel } from '@dbux/data/src/helpers/makeLabels';
import { truncateStringDefault } from '@dbux/common/src/util/stringUtil';
import TraceNode from '../../codeUtil/treeView/TraceNode';
import TraceContainerNode from '../../codeUtil/treeView/TraceContainerNode';



/** ###########################################################################
 * {@link ConsoleTraceNode}
 * ##########################################################################*/

class ConsoleTraceNode extends TraceNode {
  static makeProperties(trace) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const consoleMessage = dp.util.renderConsoleMessage(trace.traceId);
    return { consoleMessage };
  }

  static makeLabel(trace, parent, { consoleMessage }) {
    return truncateStringDefault(consoleMessage);
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

export default class GlobalConsoleNode extends TraceContainerNode {
  static labelPrefix = 'Console';
  static TraceNodeClass = ConsoleTraceNode;

  static getAllTraces(/*trace*/) {
    return allApplications.selection.data.collectGlobalStats((dp) => {
      return dp.indexes.traces.byPurpose.get(TracePurpose.Console);
    });
  }

  get collapseChangeUserActionType() {
    return UserActionType.GlobalConsoleUse;
  }

  init() {
    super.init();
    this.contextValue = 'dbuxGlobalAnalysisView.node.consoleNodeRoot#traceContainer';
  }
}