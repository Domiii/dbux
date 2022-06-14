/* eslint-disable camelcase */

import { TreeItem } from 'vscode';
import size from 'lodash/size';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeContextLabel, makeContextLocLabel, makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import DataDependencyGraph from '@dbux/data/src/ddg/DataDependencyGraph';
import ddgQueries from '@dbux/data/src/ddg/ddgQueries';
import makeTreeItem, { makeTreeChildren, makeTreeItems, objectToTreeItems } from '../../helpers/makeTreeItem';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import { disposeDDGWebviews, getDDGDot } from '../../webViews/ddgWebView';
import { renderStringInNewEditor } from '../../traceDetailsView/valueRender';
import { makeDDGNodeDescription, makeDDGNodeLabel, renderEdges, renderDDGNodesItem, renderNodeTree, renderDDGSummaries } from '../../treeViewsShared/ddgTreeViewUtil';

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
        children() {
          return allDDGs.map((ddg) => {
            const { graphId, og } = ddg;
            const { dp } = ddg;
            const {
              timelineNodes,
              edges: allEdges,
              summaryModes,
              nodeSummaries
            } = ddg.getRenderData();


            /** ###########################################################################
             * make DDG entries
             * ##########################################################################*/

            return makeTreeItem(
              graphId,
              [
                function Complete_Tree() {
                  const root = timelineNodes[1];
                  return renderNodeTree(ddg, root);
                },

                function Visible_Nodes() {
                  const visibleNodes = ddgQueries.getAllVisibleNodes(ddg);
                  return renderDDGNodesItem(ddg, visibleNodes, 'Visible Nodes');
                },
                function Visible_Edges() {
                  const actualEdges = allEdges.filter(Boolean);
                  return renderEdges(ddg, actualEdges, 'Visible Edges');
                },

                function All_Nodes() {
                  const nodes = timelineNodes.filter(Boolean);
                  return renderDDGNodesItem(ddg, nodes, 'All Nodes');
                },
                function All_Edges() {
                  const actualEdges = og.edges.filter(Boolean);
                  return renderEdges(ddg, actualEdges, 'All Edges');
                },
                function All_In_Edges() {
                  return {
                    children() {
                      return Object.entries(og.inEdgesByTimelineId)
                        .map(([nodeId, edgeIds]) => {
                          const edges = edgeIds.map(id => og.edges[id]);
                          return renderEdges(ddg, edges, makeDDGNodeLabel(ddg, nodeId), makeDDGNodeDescription(ddg, timelineNodes[nodeId]));
                        });
                    },
                    props: {
                      description: `(${size(og.inEdgesByTimelineId)})`
                    }
                  };
                },
                function All_Out_Edges() {
                  return {
                    children() {
                      return Object.entries(og.outEdgesByTimelineId)
                        .map(([nodeId, edgeIds]) => {
                          const edges = edgeIds.map(id => og.edges[id]);
                          return renderEdges(ddg, edges, makeDDGNodeLabel(ddg, nodeId), makeDDGNodeDescription(ddg, timelineNodes[nodeId]));
                        });
                    },
                    props: {
                      description: `(${size(og.outEdgesByTimelineId)})`
                    }
                  };
                },
                function Node_Summaries() {
                  return {
                    children() {
                      return renderDDGSummaries(ddg, nodeSummaries);
                    },
                    props: {
                      description: `(${size(nodeSummaries)})`
                    }
                  };
                },
                function Dot() {
                  return {
                    props: {
                      async handleClick() {
                        let dot = await getDDGDot(ddg);
                        if (!dot) {
                          try {
                            this.treeNodeProvider.refresh();
                          }
                          catch (err) {
                            // ignore err
                          }
                          dot = await getDDGDot();
                        }
                        if (dot) {
                          await renderStringInNewEditor('dot', dot);
                        }
                      }
                    }
                    // children() {
                    // }
                  };
                }
              ],
              {
                ddg
              });
          });
        }
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
