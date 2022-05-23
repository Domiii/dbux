/* eslint-disable camelcase */
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeContextLabel, makeContextLocLabel, makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import DataDependencyGraph from '@dbux/data/src/ddg/DataDependencyGraph';
import { DDGTimelineNode } from '@dbux/data/src/ddg/DDGTimelineNodes';
import makeTreeItem, { makeTreeChildren, makeTreeItems } from '../../helpers/makeTreeItem';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { TreeItem } from 'vscode';

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

    /**
     * @type {TreeItem}
     */
    let ddgNode;
    if (allDDGs.length) {
      ddgNode = {
        children: allDDGs.map((ddg) => {
          const { graphId } = ddg;
          const {
            timelineRoot,
            timelineNodes,
            timelineDataNodes,
            edges
          } = ddg.getRenderData();

          /**
           * @param {DDGTimelineNode} node 
           */
          function buildTreeNode(node) {
            const { children: childrenIds = EmptyArray } = node;
            const children = childrenIds.map(childId => {
              const childNode = timelineNodes[childId];
              return buildTreeNode(childNode);
            });
            return makeTimelineNodeEntry(node, children);
          }

          /**
           * @param {DDGTimelineNode} node 
           */
          function makeTimelineNodeEntry(node, children, moreProps = EmptyObject) {
            const { timelineId, dataTimelineId, label: nodeLabel } = node;
            const label = nodeLabel || `${node.constructor.name}`;
            return makeTreeItem(label, children, {
              description: `${dataTimelineId && `${dataTimelineId} ` || ''}(${timelineId})`,
              handleClick() {
                const { dp } = ddg;
                let { dataNodeId = null, traceId } = node;

                if (!traceId && dataNodeId) {
                  ({ traceId } = dp.collections.dataNodes.getById(dataNodeId));
                }
                if (traceId) {
                  const trace = dp.collections.traces.getById(traceId);
                  traceSelection.selectTrace(trace, null, dataNodeId);
                }
              },
              ...moreProps
            });
          }

          return makeTreeItem(graphId, [
            function Timeline_Tree() {
              return buildTreeNode(timelineRoot);
            },
            function All_Timeline_Nodes() {
              return {
                children: timelineNodes.filter(Boolean).map((node) => {
                  const { timelineId, dataTimelineId, label: nodeLabel, ...nodeProps } = node;
                  return makeTimelineNodeEntry(node, nodeProps);
                }),
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
      ddgNode = {
        children: [
          makeTreeItem('No DDG created.')
        ]
      };
    }

    ddgNode.props = {
      description: `${allDDGs.length}`,
      handleClick: () => {
        this.treeNodeProvider.refresh();
      }
    };
    return ddgNode;
  }.bind(this);

  nodes() {
    return [
      this.Async,
      this.DDG
    ];
  }

  buildChildren() {
    // TODO: don't build individual node children unless expanded
    return makeTreeItems(...this.nodes());
  }
}
