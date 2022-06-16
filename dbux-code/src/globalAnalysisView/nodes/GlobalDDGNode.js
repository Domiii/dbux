/* eslint-disable camelcase */

import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import size from 'lodash/size';
import allApplications from '@dbux/data/src/applications/allApplications';
import DataDependencyGraph from '@dbux/data/src/ddg/DataDependencyGraph';
import ddgQueries from '@dbux/data/src/ddg/ddgQueries';
import DDGSummaryMode, { isExpandedMode } from '@dbux/data/src/ddg/DDGSummaryMode';
import { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
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
 * {@link GlobaDDGNode}
 * ##########################################################################*/

export default class GlobaDDGNode extends BaseTreeViewNode {
  static makeLabel(/*app, parent*/) {
    return `PDGs`;
  }

  allDDGs;

  init() {
    // hook up events
    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.refresh();
      for (const app of selectedApps) {
        allApplications.selection.subscribe(app.dataProvider.ddgs.onSetChanged(this.refresh));
        allApplications.selection.subscribe(app.dataProvider.ddgs.onGraphUpdate(this.refresh));
      }
    });
    this.#handleRefreshOrInit();
  }

  refresh = () => {
    this.#handleRefreshOrInit();
    this.treeNodeProvider.refreshNode(this);
  };

  #handleRefreshOrInit() {
    /**
     * @type {DataDependencyGraph[]}
     */
    this.allDDGs = allApplications.selection.data.collectGlobalStats((dp) => {
      return dp.ddgs.getAll();
    });
    this.description = `(${this.allDDGs.length})`;
  }

  handleClick() {
    // this.treeNodeProvider.refresh();
    this.refresh();
  }

  buildChildren() {
    if (!this.allDDGs.length) {
      return [makeTreeItem('(no DDG is open)')];
    }
    return this.allDDGs.map((ddg) => {
      const ddgItem = this.buildDDGNode(ddg);
      return ddgItem;
    });
  }

  /**
   * 
   * @param {DataDependencyGraph} ddg 
   */
  buildDDGNode(ddg) {
    const { graphId, og } = ddg;
    const {
      timelineNodes,
      edges: allEdges,
      nodeSummaries
    } = ddg.getRenderData();

    const ddgItem = makeTreeItem(() => ({
      label: graphId,
      children: () => (makeTreeItems(
        function Group_Tree() {
          const root = timelineNodes[1];
          return renderNodeTree(ddg, root, {
            predicate: (node) => isControlGroupTimelineNode(node.type),
            propsFactory: (node) => {
              const summaryMode = ddg.summaryModes[node.timelineId];
              return {
                handleClick: () => {
                  if (isExpandedMode(summaryMode)) {
                    // collapse
                    ddg.setSummaryMode(node.timelineId, DDGSummaryMode.CollapseSummary);
                  }
                  else {
                    // expand
                    ddg.setSummaryMode(node.timelineId, DDGSummaryMode.ExpandSelf);
                  }
                },
                collapsibleState: isExpandedMode(summaryMode) ?
                  TreeItemCollapsibleState.Expanded :
                  TreeItemCollapsibleState.Collapsed
              };
            }
          });
        },

        // function Detailed_Tree() {
        //   const root = timelineNodes[1];
        //   return renderNodeTree(ddg, root);
        // },

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
                  return renderEdges(ddg, edges,
                    makeDDGNodeLabel(ddg, nodeId),
                    makeDDGNodeDescription(ddg, timelineNodes[nodeId])
                  );
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
                  return renderEdges(ddg, edges,
                    makeDDGNodeLabel(ddg, nodeId),
                    makeDDGNodeDescription(ddg, timelineNodes[nodeId])
                  );
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
      )),
      props: {
        /**
         * Used for reveal magic in `revealDDG`.
         */
        ddg
      }
    }));

    return ddgItem;
  }
}
