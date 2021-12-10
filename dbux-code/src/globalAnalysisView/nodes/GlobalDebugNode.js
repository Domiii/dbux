/* eslint-disable camelcase */
import isString from 'lodash/isString';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeContextLabel, makeContextLocLabel, makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import makeTreeItem, { makeTreeItems } from '../../helpers/makeTreeItem';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * util
 *  #########################################################################*/

function makeArrayLengthLabel(arr, label) {
  return `${label && (label + ' ') || ''}(${arr?.length || 0})`;
}

/** ###########################################################################
 * {@link GlobalDebugNode}
 * ##########################################################################*/

export default class GlobalDebugNode extends BaseTreeViewNode {
  static makeLabel(/*app, parent*/) {
    return `Debug`;
  }

  get collapseChangeUserActionType() {
    return UserActionType.GlobalDebugAppUse;
  }

  init() {
    this.description = ``;
  }

  nodes() {
    return [
      /** ###########################################################################
       * {@link Async}
       * ##########################################################################*/
      function Async() {
        return {
          children: [
            /** ########################################
             * Callbacks
             * #######################################*/
            function Patched_Callbacks() {
              const allPatchedCallbackNodes = allApplications.selection.data.collectGlobalStats((dp, app) => {
                return Array.from(new Set(
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
              });

              return {
                children: allPatchedCallbackNodes,
                props: { description: `${makeArrayLengthLabel(allPatchedCallbackNodes)}` }
              };
            },

            /** ########################################
             * Syncing Roots
             * #######################################*/
            function Syncing_Roots() {
              const syncingAsyncNodes = allApplications.selection.data.collectGlobalStats((dp, app) => {
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

              return {
                children: syncingAsyncNodes,
                props: { description: `${makeArrayLengthLabel(syncingAsyncNodes)}` }
              };
            }
          ],
          props: { description: `` }
        };
      }
    ];
  }

  buildChildren() {
    return makeTreeItems(...this.nodes());
  }
}
