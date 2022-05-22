/* eslint-disable camelcase */
import isString from 'lodash/isString';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeContextLabel, makeContextLocLabel, makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import makeTreeItem, { makeTreeChildren, makeTreeItems } from '../../helpers/makeTreeItem';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import DataDependencyGraph from '@dbux/data/src/ddg/DataDependencyGraph';

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

  /** ###########################################################################
   * {@link #Patched_Callbacks}
   * ##########################################################################*/
  Patched_Callbacks = function Patched_Callbacks() {
    const allPatchedCallbackNodes = allApplications.selection.data.collectGlobalStats((dp, app) => {
      const patchedTraces = dp.util.getAllTracesOfType(TraceType.BeforeCallExpression).
        filter(bceTrace => !!bceTrace.data?.patchedCallbacks?.length);

      const staticTraceIds = Array.from(new Set(
        patchedTraces.map(bceTrace => bceTrace.staticTraceId)
      ));

      // 1. group by staticTrace
      const staticTraceNodes = staticTraceIds.map(staticTraceId => {
        const traces = dp.indexes.traces.byStaticTrace.get(staticTraceId).
          filter(bceTrace => !!bceTrace.data?.patchedCallbacks?.length);

        const firstTrace = traces[0];
        const staticLabel = makeTraceLabel(firstTrace);

        // 2. group by trace
        const traceNodes = traces.map((trace, iTrace) => {
          // const callId = trace.traceId;

          // 3. group by patch (one trace might be patched more than once)
          const patchNodes = trace.data.patchedCallbacks.map((patchedCallback, iPatch) => {
            const { schedulerTraceId, ref: refId, name } = patchedCallback;
            const patchLabel = dp.util.getRefFirstDataNodeValueStringShort(refId);


            return makeTreeItem(
              // schedulerTraceId && makeTraceLabel(dp.util.getTrace(schedulerTraceId)) || name,
              // iPatch,
              patchLabel,
              null,
              patchedCallback,
              {
                description: JSON.stringify(patchedCallback),
                handleClick() {
                  // TODO
                }
              }
            );
          });

          return makeTreeItem(
            // makeTraceLabel(trace),
            iTrace,
            patchNodes,
            {
              description: `(${patchNodes.length})`,
              handleClick() {
                traceSelection.selectTrace(trace);
              }
            }
          );
        });

        return makeTreeItem(
          staticLabel,
          traceNodes,
          {
            description: `(${traceNodes.length})`,
            handleClick() {
              traceSelection.selectTrace(firstTrace);
            }
          }
        );
      });

      return staticTraceNodes;
    });

    return {
      children: allPatchedCallbackNodes,
      props: { description: `${makeArrayLengthLabel(allPatchedCallbackNodes)}` }
    };
  };

  /** ###########################################################################
   * {@link Async}
   * ##########################################################################*/
  Async = function Async() {
    return {
      children: [
        this.Patched_Callbacks.bind(this),

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
  }.bind(this);

  /** ###########################################################################
   * {@link DDG}
   *  #########################################################################*/
  DDG = function DDG() {
    /**
     * @type {DataDependencyGraph[]}
     */
    const allDDGs = allApplications.selection.data.collectGlobalStats((dp) => {
      return dp.ddgs.getAll();
    });

    if (allDDGs.length) {
      return {
        children: allDDGs.map((ddg) => {
          const { graphId } = ddg;
          const { 
            timelineRoot,
            // timelineNodes,
            timelineDataNodes,
            edges
          } = ddg.getRenderData();
          return makeTreeItem(graphId, [
            function Timeline_Tree() {
              return {
                children: makeTreeChildren(timelineRoot)
              };
            },
            function Timeline_Data_Nodes() {
              return {
                children: timelineDataNodes.filter(Boolean).map((node) => {
                  const { label, dataTimelineId, timelineId, dataNodeId, ...otherProps } = node;
                  return makeTreeItem(label, otherProps, {
                    description: `${dataTimelineId} (${timelineId})`,
                    handleClick() {
                      const { dp } = ddg;
                      const { traceId } = dp.collections.dataNodes.getById(dataNodeId);
                      const trace = dp.collections.traces.getById(traceId);
                      traceSelection.selectTrace(trace, null, dataNodeId);
                    }
                  });
                }),
              };
            },
            function Edges() {
              return {
                children: edges.filter(Boolean).map((edge) => {
                  const { ...otherProps } = edge;
                  const fromNode = timelineDataNodes[edge.from];
                  const toNode = timelineDataNodes[edge.to];
                  const label = `${fromNode.label} -> ${toNode.label}`;
                  return makeTreeItem(label, otherProps, {
                    handleClick() {
                      // select `from` node
                      const { dp } = ddg;
                      const fromDataNodeId = fromNode.dataNodeId;
                      const { traceId } = dp.collections.dataNodes.getById(fromDataNodeId);
                      const trace = dp.collections.traces.getById(traceId);
                      traceSelection.selectTrace(trace, null, fromDataNodeId);
                    }
                  });
                }),
              };
            }
          ]);
        }),
      };
    }
    else {
      return {
        children: [
          makeTreeItem('No DDG created.')
        ]
      };
    }
  };

  nodes() {
    return [
      this.Async,
      this.DDG
    ];
  }

  buildChildren() {
    return makeTreeItems(...this.nodes());
  }
}
