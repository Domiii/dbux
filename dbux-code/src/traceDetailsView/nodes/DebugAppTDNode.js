import isString from 'lodash/isString';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { parseNodeModuleName } from '@dbux/common-node/src/util/pathUtil';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import AsyncEventUpdateType, { isPostEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeContextLabel, makeContextLocLabel, makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { makeTreeItem, makeTreeItems } from '../../helpers/treeViewHelpers';
import { ContextTDNode, TraceTypeTDNode } from './traceInfoNodes';
import TraceDetailNode from './traceDetailNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * util
 *  #########################################################################*/

function makeArrayLengthLabel(arr, label) {
  return `${label && (label + ' ') || ''}(${arr?.length || 0})`;
}


/** ###########################################################################
 * {@link DebugAppTDNode}
 * ##########################################################################*/

export class DebugAppTDNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'Debug (App)';
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDDebugAppUse;
  }

  init() {
    this.description = ``;
  }

  /** ###########################################################################
   * childClasses
   *  #########################################################################*/

  // makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }

  // childClasses = [

  // ];

  buildChildren() {
    const { dp, app } = this;

    /** ###########################################################################
     * {@link Async}
     * ##########################################################################*/

    const allPatchedCallbackNodes = Array.from(new Set(
      dp.util.getAllTracesOfType(TraceType.BeforeCallExpression)
        .flatMap(bceTrace =>
          bceTrace.data?.patchedCallbacks?.map(patchedCallback => ({
            callId: bceTrace.traceId,
            ...patchedCallback
          })) || 
          EmptyArray
        )
        .map((patchedCallback) => {
          const { schedulerTraceId, ref, callId } = patchedCallback;
          const trace = schedulerTraceId && dp.util.getTrace(schedulerTraceId) ||
            (callId && dp.util.getTrace(callId)) ||
            (isString(ref) ? ref : (ref && dp.util.getFirstTraceByRefId(ref) || '(unknown)'));
          return makeTreeItem(
            schedulerTraceId && makeTraceLabel(dp.util.getTrace(schedulerTraceId)) || ref,
            patchedCallback,
            {
              handleClick() {
                if (trace) {
                  traceSelection.selectTrace(trace);
                }
              }
            }
          );
        })
    ));

    const syncingAsyncNodes = dp.collections.asyncNodes.getAllActual()
      .filter(asyncNode => !!asyncNode.syncPromiseIds?.length);

    const Async = makeTreeItem(
      'Async',
      [
        /** ########################################
         * Callbacks
         * #######################################*/
        makeTreeItem(
          'Patched Callbacks',
          allPatchedCallbackNodes,
          {
            description: ``
          }
        ),

        /** ########################################
         * Syncing Roots
         * #######################################*/
        makeTreeItem(
          'Syncing Roots',
          syncingAsyncNodes.map(asyncNode => {
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
          }),
          { description: `${makeArrayLengthLabel(syncingAsyncNodes)}` }
        )
      ],
      { description: `` }
    );

    return [
      Async
    ];
  }
}
