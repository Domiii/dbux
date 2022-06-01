/* eslint-disable camelcase */

import { TreeItem } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeContextLabel, makeContextLocLabel, makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import DataDependencyGraph from '@dbux/data/src/ddg/DataDependencyGraph';
import { DDGTimelineNode } from '@dbux/data/src/ddg/DDGTimelineNodes';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DDGSummaryMode from '@dbux/data/src/ddg/DDGSummaryMode';
import ddgQueries from '@dbux/data/src/ddg/ddgQueries';
import makeTreeItem, { makeTreeChildren, makeTreeItems, objectToTreeItems } from '../../helpers/makeTreeItem';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';

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
          const { graphId, og } = ddg;
          const {
            timelineNodes,
            edges,
            summaryModes,
            nodeSummaries
          } = ddg.getRenderData();

          /**
           * @param {DDGTimelineNode} node 
           */
          function makeTreeNode(node) {
            if (!node) {
              return makeTreeItem('(null)'); // DDG build has a bug
            }
            const { children: childrenIds = EmptyArray } = node;
            const children = new childrenIds.constructor();
            Object.entries(childrenIds).forEach(([key, childId]) => {
              const childNode = timelineNodes[childId];
              children[key] = makeTreeNode(childNode);
            });
            return makeTimelineNodeEntry(node, children);
          }

          function makeNodeDescription(node) {
            const { timelineId, constructor, watched } = node;
            const summaryMode = summaryModes[timelineId];
            // eslint-disable-next-line no-nested-ternary
            const summaryModeLabel = watched ?
              'Watched' :
              summaryMode ?
                DDGSummaryMode.nameFrom(summaryMode) :
                '';
            return `${timelineId} [${constructor.name}] ${summaryModeLabel}`;
          }

          /**
           * @param {DDGTimelineNode} node 
           */
          function makeTimelineNodeEntry(node, children = node, moreProps = EmptyObject) {
            const { label: nodeLabel } = node;
            const label = nodeLabel || `${node.constructor.name}`;
            return makeTreeItem(label, children, {
              description: makeNodeDescription(node),
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

          // function renderDataTimelineNodes(nodeIds) {
          //   return {
          //     children: nodeIds.map((timelineId) => {
          //       const node = timelineNodes[timelineId];
          //       const { label, ...entry } = node;
          //       delete entry.timelineId;
          //       return makeTreeItem(label, entry, {
          //         description: makeNodeDescription(node),
          //         handleClick() {
          //           const { dp } = ddg;
          //           const { traceId } = dp.collections.dataNodes.getById(node.dataNodeId);
          //           const trace = dp.collections.traces.getById(traceId);
          //           traceSelection.selectTrace(trace, null, node.dataNodeId);
          //         }
          //       });
          //     }),
          //     props: {
          //       description: `(${nodeIds.length})`
          //     }
          //   };
          // }

          function renderEdges(actualEdges) {
            return {
              children: actualEdges.map((edge) => {
                let { from, to, ...entry } = edge;
                const fromNode = timelineNodes[from];
                const toNode = timelineNodes[to];
                const label = `${fromNode?.label} -> ${toNode?.label}`;
                const children = makeTreeItems(
                  makeTreeItem(
                    'from',
                    fromNode,
                    {
                      description: `${from}`
                    }
                  ),
                  makeTreeItem(
                    'to',
                    toNode,
                    {
                      description: `${to}`
                    }
                  ),
                  ...objectToTreeItems(entry)
                );
                return makeTreeItem(label, children, {
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
              props: {
                description: `(${actualEdges.length})`
              }
            };
          }

          function renderNodes(nodes) {
            return {
              children: nodes.map((node) => {
                const { timelineId, label: nodeLabel, ...entry } = node;
                // delete entry.timelineId;
                return makeTimelineNodeEntry(node, entry);
              }),
              props: {
                description: `(${nodes.length})`
              }
            };
          }

          /** ###########################################################################
           * make DDG entries
           * ##########################################################################*/

          return makeTreeItem(graphId, [
            function Complete_Tree() {
              const root = timelineNodes[1];
              return makeTreeNode(root);
            },


            function Visible_Nodes() {
              const visibleNodes = ddgQueries.getAllVisibleNodes(ddg);
              return renderNodes(visibleNodes);
            },
            function Visible_Edges() {
              const actualEdges = edges.filter(Boolean);
              return renderEdges(actualEdges);
            },

            function All_Nodes() {
              const nodes = timelineNodes.filter(Boolean);
              return renderNodes(nodes);
            },
            function All_Edges() {
              const actualEdges = og.edges.filter(Boolean);
              return renderEdges(actualEdges);
            },
            function Node_Summaries() {
              return {
                children() {
                  return Object.entries(nodeSummaries).map(([timelineId, summary]) => {
                    const {
                      summaryRoots,
                      snapshotsByRefId
                    } = summary;
                    const node = timelineNodes[timelineId];
                    return makeTreeItem(node.label,
                      {
                        node: makeTimelineNodeEntry(node),
                        roots: summaryRoots.map(rootId => {
                          const root = timelineNodes[rootId];
                          return makeTreeNode(root);
                        }),
                        snapshotsByRefId
                      },
                      {
                        // description: `${summaryModeLabel}`
                      }
                    );
                  });
                }
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
