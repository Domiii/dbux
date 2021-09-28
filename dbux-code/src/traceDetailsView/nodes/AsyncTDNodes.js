import UserActionType from '@dbux/data/src/pathways/UserActionType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import AsyncEventUpdateType, { isPostEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import { makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import traceSelection from '@dbux/data/src/traceSelection';
import { showInformationMessage } from '../../codeUtil/codeModals';
import { makeTreeItem } from '../../helpers/treeViewHelpers';
import TraceDetailNode from './traceDetailNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

class RootEdgesTDNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'Root: Async Edges';
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDAsyncUse;
  }

  get allEdges() {
    const { trace, dp } = this;

    const {
      rootContextId
    } = trace;

    return [
      ...dp.indexes.asyncEvents.to.get(rootContextId) || EmptyArray,
      ...dp.indexes.asyncEvents.from.get(rootContextId) || EmptyArray
    ];
  }

  get asyncNode() {
    return this.dp.indexes.asyncNodes.byRoot.getUnique(this.trace.rootContextId);
  }

  init() {
    this.contextValue = 'dbuxTraceDetailsView.node.asyncRootEdgesTDNode';
    this.description = `(${this.allEdges.length || 0})`;
  }

  // makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }

  buildChildren() {
    const { trace, dp } = this;

    const {
      rootContextId
    } = trace;

    // ###########################################################################
    // async
    // ###########################################################################

    function makeEventNode(evt, isFrom) {
      const dirLabel = isFrom ? 'from' : 'to';
      const rootId = evt[`${dirLabel}RootContextId`];
      return makeTreeItem(
        `${`${AsyncEdgeType.nameFromForce(evt.edgeType).toUpperCase()}`} ${dirLabel} ${rootId}`,
        evt,
        {
          handleClick() {
            let targetTrace;
            if (isFrom) {
              // FROM -> go to scheduler
              const asyncNode = dp.util.getAsyncNode(evt.toRootContextId);
              targetTrace = dp.collections.traces.getById(asyncNode?.schedulerTraceId);
            }
            else {
              // TO -> go to first trace in root
              targetTrace = dp.util.getFirstTraceOfContext(rootId);
            }
            if (targetTrace) {
              traceSelection.selectTrace(targetTrace);
            }
          }
        }
      );
    }
    const inEvents = dp.indexes.asyncEvents.to.get(rootContextId)
      ?.map(evt => makeEventNode(evt, true)) || EmptyArray;
    const outEvents = dp.indexes.asyncEvents.from.get(rootContextId)
      ?.map(evt => makeEventNode(evt, false)) || EmptyArray;

    // ###########################################################################
    // final result
    // ###########################################################################

    return [
      ...inEvents,
      ...outEvents
    ];
  }

  selectForkParent() {
    const { dp, asyncNode: { asyncNodeId } } = this;
    const forkParent = dp.util.getAsyncParent(asyncNodeId);
    if (forkParent) {
      const trace = dp.util.getTraceOfAsyncNode(forkParent.asyncNodeId);
      if (trace) {
        traceSelection.selectTrace(trace);
        return;
      }
    }
    showInformationMessage(`Can't find "forkParent" of current trace`);
  }

  selectScheduler() {
    const { schedulerTraceId } = this.asyncNode;
    if (schedulerTraceId) {
      const schedulerTrace = this.dp.collections.traces.getById(schedulerTraceId);
      if (schedulerTrace) {
        traceSelection.selectTrace(schedulerTrace);
        return;
      }
    }
    showInformationMessage(`Can't find "scheduler" of current trace`);
  }
}

class ScheduledEdgesTDNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'Trace: scheduled';
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDAsyncUse;
  }

  get allUpdates() {
    return this.dp.indexes.asyncEventUpdates.byTrace.get(this.trace.traceId) || EmptyArray;
  }

  init() {
    this.description = `(${this.allUpdates.length})`;
  }

  buildChildren() {
    return this.allUpdates.map(this.makeEventUpdateNode);
  }

  makeEventUpdateNode = (update) => {
    const { type, rootId } = update;
    const rootContext = this.dp.collections.executionContexts.getById(rootId);
    const contextLabel = isPostEventUpdate(type) ? makeContextLabel(rootContext, this.app) + ' ' : '';
    return makeTreeItem(
      `${`${AsyncEventUpdateType.nameFromForce(type)}`}`,
      update,
      {
        description: `${contextLabel}#${rootId}`,
        handleClick: () => {
          const firstTrace = this.dp.indexes.traces.byContext.getFirst(rootId);
          if (firstTrace) {
            traceSelection.selectTrace(firstTrace);
          }
        }
      }
    );
  }
}

export default class AsyncTDNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'Async';
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDAsyncUse;
  }

  buildChildren() {
    return [
      this.treeNodeProvider.buildNode(RootEdgesTDNode, this.trace, this),
      this.treeNodeProvider.buildNode(ScheduledEdgesTDNode, this.trace, this),
    ];
  }
}