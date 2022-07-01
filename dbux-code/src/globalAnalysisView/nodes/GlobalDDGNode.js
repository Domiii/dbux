/* eslint-disable camelcase */

import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import size from 'lodash/size';
import groupBy from 'lodash/groupBy';
import allApplications from '@dbux/data/src/applications/allApplications';
import DataDependencyGraph from '@dbux/data/src/pdg/DataDependencyGraph';
import pdgQueries from '@dbux/data/src/pdg/pdgQueries';
import PDGSummaryMode, { isExpandedMode } from '@dbux/data/src/pdg/PDGSummaryMode';
import { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/PDGTimelineNodeType';
import { truncateStringDefault, truncateStringShort } from '@dbux/common/src/util/stringUtil';
import makeTreeItem, { makeTreeChildren, mkTreeItem, makeTreeItems, objectToTreeItems } from '../../helpers/makeTreeItem';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import { disposePDGWebviews, getPDGDot } from '../../webViews/pdgWebView';
import { renderStringInNewEditor } from '../../traceDetailsView/valueRender';
// eslint-disable-next-line max-len
import { makePDGNodeDescription, makePDGNodeLabel, renderEdges, renderPDGNodesItem, renderNodeTree, renderPDGSummaries, renderPDGNode, renderRefGroups, renderVarGroups } from '../../treeViewsShared/pdgTreeViewUtil';
import traceSelection from '@dbux/data/src/traceSelection';
import ValueTypeCategory from '@dbux/common/src/types/constants/ValueTypeCategory';


/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * util
 *  #########################################################################*/

function makeArrayLengthLabel(arr, label) {
  return `${label && (label + ' ') || ''}(${arr?.length || 0})`;
}

/** ###########################################################################
 * {@link GlobaPDGNode}
 * ##########################################################################*/

export default class GlobaPDGNode extends BaseTreeViewNode {
  static makeLabel(/*app, parent*/) {
    return `PDGs`;
  }

  allPDGs;

  init() {
    // hook up events
    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.refresh();
      for (const app of selectedApps) {
        allApplications.selection.subscribe(app.dataProvider.pdgs.onSetChanged(this.refresh));
        allApplications.selection.subscribe(app.dataProvider.pdgs.onGraphUpdate(this.refresh));
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
    this.allPDGs = allApplications.selection.data.collectGlobalStats((dp) => {
      return dp.pdgs.getAll();
    });
    this.description = `(${this.allPDGs.length})`;
  }

  handleClick() {
    this.treeNodeProvider.refresh();
    // this.refresh();
  }

  buildChildren() {
    if (!this.allPDGs.length) {
      return [makeTreeItem('(no PDG is open)')];
    }
    return this.allPDGs.map((pdg) => {
      const pdgItem = this.buildPDGNode(pdg);
      return pdgItem;
    });
  }

  /**
   * 
   * @param {DataDependencyGraph} pdg 
   */
  buildPDGNode(pdg) {
    const { graphId, og } = pdg;
    const {
      timelineNodes,
      edges: allEdges,
      nodeSummaries
    } = pdg.getRenderData();

    const self = this; // hackfix

    const pdgItem = makeTreeItem(() => ({
      label: graphId,
      children: () => (makeTreeItems(
        function Group_Tree() {
          const root = timelineNodes[1];
          const rootItem = renderNodeTree(pdg, root, {
            predicate: (node) => isControlGroupTimelineNode(node.type),
            propsFactory: (node, children) => {
              const summaryMode = pdg.summaryModes[node.timelineId];
              const expanded = isExpandedMode(summaryMode) ||
                Object.values(children).some(c => c.collapsibleState === TreeItemCollapsibleState.Expanded);
              const cannotExpand = !expanded && !pdgQueries.canNodeExpand(pdg, node);
              const collapsibleState = (expanded) ?
                TreeItemCollapsibleState.Expanded :
                cannotExpand ?
                  TreeItemCollapsibleState.None :
                  TreeItemCollapsibleState.Collapsed;
              return {
                handleClick: () => {
                  pdg.toggleSummaryMode(node.timelineId);
                },
                // collapsibleState: TreeItemCollapsibleState.Expanded
                collapsibleState
              };
            }
          });

          // console.log(`ROOT EXPANDED ${PDGSummaryMode.nameFrom(pdg.summaryModes[1])} ${rootItem.collapsibleState === TreeItemCollapsibleState.Expanded}`);
          return rootItem;
        },

        // function Detailed_Tree() {
        //   const root = timelineNodes[1];
        //   return renderNodeTree(pdg, root);
        // },

        function Visible_Nodes() {
          const visibleNodes = pdgQueries.getAllVisibleNodes(pdg);
          return renderPDGNodesItem(pdg, visibleNodes, 'Visible Nodes');
        },
        function Visible_Edges() {
          const actualEdges = allEdges.filter(Boolean);
          return renderEdges(pdg, actualEdges, 'Visible Edges');
        },

        function All_Nodes() {
          const nodes = timelineNodes.filter(Boolean);
          return renderPDGNodesItem(pdg, nodes, 'All Nodes');
        },
        function All_Edges() {
          const actualEdges = og.edges.filter(Boolean);
          return renderEdges(pdg, actualEdges, 'All Edges');
        },
        function All_In_Edges() {
          return {
            children() {
              return Object.entries(og.inEdgesByTimelineId)
                .map(([nodeId, edgeIds]) => {
                  const edges = edgeIds.map(id => og.edges[id]);
                  return renderEdges(pdg, edges,
                    makePDGNodeLabel(pdg, nodeId),
                    makePDGNodeDescription(pdg, timelineNodes[nodeId])
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
                  return renderEdges(pdg, edges,
                    makePDGNodeLabel(pdg, nodeId),
                    makePDGNodeDescription(pdg, timelineNodes[nodeId])
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
              return renderPDGSummaries(pdg, nodeSummaries);
            },
            props: {
              description: `(${size(nodeSummaries)})`
            }
          };
        },
        /** ###########################################################################
         * Summarizable Writes
         * ##########################################################################*/
        function Summarizable_Writes() {
          const { dp } = pdg;

          return {
            children() {
              const summarizableNodes = timelineNodes.filter(node => !!node?.hasSummarizableWrites && !!node.dataNodeId);

              const getAccessedRefId = timelineNode => dp.util.getDataNodeAccessedRefId(timelineNode.dataNodeId);
              const accessedRefIds = new Set(summarizableNodes.map(getAccessedRefId));
              const accessedRefGroups = renderRefGroups(
                pdg,
                summarizableNodes,
                getAccessedRefId
              );
              const otherRefGroups = renderRefGroups(
                pdg,
                summarizableNodes,
                timelineNode => {
                  const { refId } = dp.util.getDataNode(timelineNode.dataNodeId);
                  if (accessedRefIds.has(refId)) { return null; }
                  return refId;
                }
              );
              let { items: varItems, groups: varGroups } = renderVarGroups(
                pdg,
                summarizableNodes.filter(n => {
                  const { refId } = dp.util.getDataNode(n.dataNodeId);
                  const ref = dp.collections.values.getById(refId);
                  return !ref || !ValueTypeCategory.is.Function(ref.category);
                })
              );
              const { items: functionVarItems, groups: functionGroups } = renderVarGroups(
                pdg,
                summarizableNodes.filter(n => {
                  const { refId } = dp.util.getDataNode(n.dataNodeId);
                  const ref = dp.collections.values.getById(refId);
                  return ref && !!ValueTypeCategory.is.Function(ref.category);
                })
              );

              varItems = Array.from(new Set(varItems.map(item => item.staticDeclarationTid)));

              return [
                mkTreeItem(
                  'Ref Access',
                  accessedRefGroups,
                  {
                    tooltip: 'All PDG nodes capturing access to a property of a reference type object. \nBy Declaring_Function → var → instance.',
                    description: `(${accessedRefGroups.length})`
                  }
                ),
                mkTreeItem(
                  'Ref Movement',
                  otherRefGroups,
                  {
                    // eslint-disable-next-line max-len
                    tooltip: 'All recorded PDG nodes capturing data flow of reference type objects but whose properties are never accessed in the PDG. There can be a large intersection between this and "Variables".',
                    description: `(${otherRefGroups.length})`
                  }
                ),
                mkTreeItem(
                  'Variables',
                  varGroups,
                  {
                    tooltip: 'All PDG nodes capturing reads or writes of variables. \nBy Declaring_Function → statement → declaration.',
                    description: `(${varItems.length} vars, ${varGroups.length} functions)`
                  }
                ),
                mkTreeItem(
                  'Functions & Callbacks',
                  functionGroups,
                  {
                    // eslint-disable-next-line max-len
                    tooltip: 'All PDG nodes capturing functions and callbacks. We generally ignore data dependencies from and to function instances for now, since they often muddy the waters of what is actually important. Need a better solution in the future.',
                    description: `(${functionGroups.length})`
                  }
                ),
              ];
            }
          };
        },

        /** ###########################################################################
         * DOT
         * ##########################################################################*/
        function Dot() {
          return {
            props: {
              async handleClick() {
                let dot = await getPDGDot(pdg);
                if (!dot) {
                  try {
                    this.treeNodeProvider.refresh();
                  }
                  catch (err) {
                    // ignore err
                  }
                  dot = await getPDGDot();
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
         * Used for reveal magic in `revealPDG`.
         */
        pdg,
        collapsibleState: TreeItemCollapsibleState.Expanded
      }
    }));

    return pdgItem;
  }
}
