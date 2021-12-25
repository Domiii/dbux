import { format } from 'util';
import stripAnsi from 'strip-ansi';
import isString from 'lodash/isString';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import { makeTraceLabel, makeTraceLocLabel } from '@dbux/data/src/helpers/makeLabels';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import TraceNode from '../../traceDetailsView/nodes/TraceNode';
import { makeShortString } from '@dbux/common/src/util/stringUtil';


function renderConsoleMessage(trace) {
  /**
   * Render accurate string result.
   * future-work: formatting for console.table et al?
   */
  const { applicationId } = trace;
  const dp = allApplications.getById(applicationId).dataProvider;
  const stringArgs = dp.util.getCallArgValueStrings(trace.traceId)
    .map(arg => isString(arg) ? arg : (arg + ''))
    .map(arg => stripAnsi(arg));

  /**
   * "the arguments are all passed to util.format()"
   * @see https://nodejs.org/api/console.html#consolelogdata-args
   */
  return format(...stringArgs);
}

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
    this.description = `${traceLabel} @${loc}`;
    this.tooltip = this.consoleMessage;
  }
}

/** ###########################################################################
 * {@link ConsoleNode}
 *  #########################################################################*/

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
        ?.map(trace => {
          const consoleMessage = renderConsoleMessage(trace);
          return this.treeNodeProvider.buildNode(ConsoleTraceNode, trace, this, { consoleMessage });
        });
    });
  }
}
