import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeTreeItem } from '../../helpers/treeViewHelpers';
import TraceDetailNode from './traceDetailNode';


/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

export class AsyncTDNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'Async Edges';
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

  init() {
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

    function makeEventNode(evt, dir) {
      const rootId = evt[`${dir}RootContextId`];
      return makeTreeItem(
        `${`${AsyncEdgeType.nameFromForce(evt.edgeType).toUpperCase()}`} ${dir} ${rootId}`,
        evt,
        {
          handleClick() {
            const firstTrace = dp.indexes.traces.byContext.getFirst(rootId);
            if (firstTrace) {
              traceSelection.selectTrace(firstTrace);
            }
          }
        }
      );
    }
    const inEvents = dp.indexes.asyncEvents.to.get(rootContextId)
      ?.map(evt => makeEventNode(evt, 'from')) || EmptyArray;
    const outEvents = dp.indexes.asyncEvents.from.get(rootContextId)
      ?.map(evt => makeEventNode(evt, 'to')) || EmptyArray;

    // ###########################################################################
    // final result
    // ###########################################################################

    return [
      ...inEvents,
      ...outEvents
    ];
  }
}