import { TreeItemCollapsibleState } from 'vscode';
import isFunction from 'lodash/isFunction';
import size from 'lodash/size';
import isNumber from 'lodash/isNumber';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import PDGNodeSummary from '@dbux/data/src/pdg/PDGNodeSummary';
import ProgramDependencyGraph from '@dbux/data/src/pdg/ProgramDependencyGraph';
import { isControlGroupTimelineNode } from '@dbux/common/src/types/constants/PDGTimelineNodeType';
import PDGSummaryMode from '@dbux/data/src/pdg/PDGSummaryMode';
import pdgQueries from '@dbux/data/src/pdg/pdgQueries';
import { groupBySorted } from '@dbux/common/src/util/arrayUtil';
import { makeContextLabel, makeStaticContextLabel, makeStaticContextLocLabel, makeTraceLocLabel } from '@dbux/data/src/helpers/makeLabels';
import traceSelection from '@dbux/data/src/traceSelection';
import { truncateStringShort } from '@dbux/common/src/util/stringUtil';
import makeTreeItem, { mkTreeItem, makeTreeItems, makeTreeChildren, objectToTreeItems } from '../helpers/makeTreeItem';
import { renderDataNode, selectDataNodeOrTrace } from './dataTreeViewUtil';

/**
 * @param {PDGTimelineNode} node 
 */
export function renderNodeTree(pdg, node, cfg) {
  const { predicate, propsFactory } = cfg || EmptyObject;
  const { timelineNodes } = pdg;
  if (!node) {
    return makeTreeItem('(null)'); // PDG build has a bug?
  }
  const { children: childrenIds = EmptyArray } = node;
  const children = new childrenIds.constructor();
  Object.entries(childrenIds).forEach(([key, childId]) => {
    const childNode = timelineNodes[childId];
    if (!predicate || predicate(childNode)) {
      // add child
      children[key] = renderNodeTree(pdg, childNode, cfg);
    }
  });
  const props = propsFactory?.(node, children) || EmptyObject;
  const nodeItem = renderPDGNode(pdg, node, children, props);

  // hackfix to allow for customizable `collapsibleState`
  nodeItem.id = node.label + '#' + Math.random() + '';
  return nodeItem;
}

function nodeTypeLabel(node) {
  return node.constructor.name.replace('TimelineNode', '');
}

/** ###########################################################################
 * nodes
 *  #########################################################################*/

export function makePDGNodeDescription(pdg, node) {
  const { summaryModes } = pdg;
  const { timelineId, dataNodeId, connected, constructor, watched, og } = node;

  const con = connected ? '🔗' : ' ';
  const dataInfo = dataNodeId ? ` (n${dataNodeId})` : '';
  const summaryMode = summaryModes[timelineId];
  // eslint-disable-next-line no-nested-ternary

  const summaryPrefix = watched ? '👁' : '';
  let summaryModeLabel =
    summaryMode ?
      PDGSummaryMode.nameFrom(summaryMode) :
      og ?
        '(unknown)' :
        'SummaryNode';
  if (isControlGroupTimelineNode(node.type)) {
    const summarizable = pdgQueries.isNodeSummarizable(pdg, node);
    const summarized = pdgQueries.isNodeSummarized(pdg, node);
    const summarizableChildren = pdgQueries.getSummarizableChildren(pdg, node.timelineId);
    summaryModeLabel += ` (sa: ${summarizable}, sed: ${summarized}, sC: ${summarizableChildren?.length || 0})`;
  }
  return `${con}${timelineId}${dataInfo} [${nodeTypeLabel(node)}] ${summaryPrefix}${summaryModeLabel}`;
}

export function makePDGNodeLabel(pdg, timelineId) {
  const node = pdg.timelineNodes[timelineId];
  return node.label || `${nodeTypeLabel(node)}`;
}

/**
 * @param {ProgramDependencyGraph} pdg
 * @param {PDGTimelineNode} node 
 */
export function renderPDGNode(pdg, node, children = null, moreProps, labelPrefix = '') {
  const { dp } = pdg;
  moreProps ||= EmptyObject;
  const labelOverride = moreProps.label;
  const { handleClick } = moreProps;
  ({ labelPrefix = labelPrefix } = moreProps);
  if ('label' in moreProps) {
    delete moreProps.label;
  }
  if ('labelPrefix' in moreProps) {
    delete moreProps.labelPrefix;
  }
  if ('handleClick' in moreProps) {
    delete moreProps.handleClick;
  }
  const label = labelOverride || makePDGNodeLabel(pdg, node.timelineId);

  if (!children) {
    children = node;
  }
  if (children === node) {
    // better rendering of things
    children = { ...node };

    const nodeChildren = children.children || EmptyArray;
    children.children = renderPDGNodesItem(pdg, nodeChildren, 'Children');
    if (children.parentNodeId) {
      children.parentNodeId = renderPDGNode(pdg, pdg.timelineNodes[children.parentNodeId], null, EmptyObject, 'Parent: ');
    }

    if (node.dataNodeId) {
      children.dataNode = renderDataNode(dp, node.dataNodeId, null, 'DataNode');
      delete children.dataNodeId;
    }

    // add edges
    children.Edges = makeTreeItems(
      renderEdgeIds(pdg, pdg.inEdgesByTimelineId[node.timelineId], 'EdgesIn'),
      renderEdgeIds(pdg, pdg.outEdgesByTimelineId[node.timelineId], 'EdgesOut'),
      renderOgEdgeIds(pdg, pdg.og.inEdgesByTimelineId[node.timelineId], 'OG Edges In'),
      renderOgEdgeIds(pdg, pdg.og.outEdgesByTimelineId[node.timelineId], 'OG Edges Out')
    );

    // TODO: also get control group by decision etc.
    // TODO: add *correct* value string (see DotBuilder.makeNodeValueString)
  }

  return makeTreeItem(
    labelPrefix + label,
    children,
    {
      description: makePDGNodeDescription(pdg, node),
      handleClick() {
        // select
        if (node.traceId || node.dataNodeId) {
          selectDataNodeOrTrace(dp, node.traceId, node.dataNodeId);
        }
        handleClick?.(node);
      },
      ...moreProps
    }
  );
}

export function renderPDGNodesItem(pdg, nodesOrIds, label) {
  return makeTreeItem(() => ({
    label,
    children() {
      if (isFunction(nodesOrIds)) {
        nodesOrIds = nodesOrIds();
      }
      const children = new nodesOrIds.constructor();
      Object.entries(nodesOrIds).forEach(([key, childOrChildId]) => {
        let child;
        if (isNumber(childOrChildId)) {
          child = pdg.timelineNodes[childOrChildId];
        }
        else {
          child = childOrChildId;
        }
        children[key] = renderPDGNode(pdg, child);
      });
      return makeTreeChildren(children);
      // return Object.values(nodes).map((node) => {
      //   // const { timelineId, label: nodeLabel } = node;
      //   // delete entry.timelineId;
      //   return renderPDGNode(pdg, node, node);
      // });
    },
    props: {
      description: isFunction(nodesOrIds) ? '' : `(${size(nodesOrIds)})`
    }
  }));
}

/** ###########################################################################
 * edges
 *  #########################################################################*/

// function renderDataTimelineNodes(nodeIds) {
//   return {
//     children: nodeIds.map((timelineId) => {
//       const node = timelineNodes[timelineId];
//       const { label, ...entry } = node;
//       delete entry.timelineId;
//       return makeTreeItem(label, entry, {
//         description: makeNodeDescription(node),
//         handleClick() {
//           const { dp } = pdg;
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

/**
 * @param {ProgramDependencyGraph} pdg
 */
export function renderEdgeIds(pdg, edgeIds, label) {
  return renderEdges(pdg, edgeIds?.map(edgeId => pdg.edges[edgeId]), label);
}

/**
 * @param {ProgramDependencyGraph} pdg
 */
export function renderOgEdgeIds(pdg, edgeIds, label) {
  return renderEdges(pdg, edgeIds?.map(edgeId => pdg.og.edges[edgeId]), label);
}

/**
 * @param {ProgramDependencyGraph} pdg
 */
export function renderEdges(pdg, edges, label = null, nodeDescription = null) {
  const { timelineNodes, dp } = pdg;
  return makeTreeItem(() => ({
    label,
    children() {
      if (!edges) {
        return [makeTreeItem('(no edges)')];
      }
      return edges.map((edge) => {
        let { from, to, ...entry } = edge;
        const fromNode = timelineNodes[from];
        const toNode = timelineNodes[to];
        const edgeLabel = `${fromNode?.label} -> ${toNode?.label}`;
        const children = makeTreeItems(
          renderPDGNode(pdg, fromNode, fromNode, {}, 'from: '),
          renderPDGNode(pdg, toNode, toNode, {}, 'to: '),
          ...objectToTreeItems(entry)
        );
        return makeTreeItem(edgeLabel, children, {
          description: `${edge.edgeId} (${edge.from} → ${edge.to})`,
          handleClick() {
            // select `from` node
            const fromDataNodeId = fromNode.dataNodeId;
            const { traceId } = dp.collections.dataNodes.getById(fromDataNodeId);
            const trace = dp.collections.traces.getById(traceId);
            traceSelection.selectTrace(trace, null, fromDataNodeId);
          }
        });
      });
    },
    props: {
      description: nodeDescription || `(${edges?.length || 0})`
    }
  }));
}

/** ###########################################################################
 * summaries
 *  #########################################################################*/

/**
 * @param {PDGNodeSummary[] || Object.<string, PDGNodeSummary>} summaries 
 */
export function renderPDGSummaries(pdg, summaries) {
  const { timelineNodes } = pdg;
  return Object.values(summaries).map(
    /**
     * @param {PDGNodeSummary} summary 
     */
    (summary) => {
      const {
        timelineId,
        summaryRoots,
        snapshotsByRefId,
        nodesByTid,
        ...other
      } = summary;
      const node = timelineNodes[timelineId];
      return makeTreeItem(node.label,
        {
          node: renderPDGNode(pdg, node, null, null, 'Summarized by: '),
          roots: summaryRoots.map(rootId => {
            const root = timelineNodes[rootId];
            return renderNodeTree(pdg, root);
          }),
          snapshotsByRefId: Object.fromEntries(snapshotsByRefId.entries()),
          nodesByTid: Object.fromEntries(nodesByTid.entries()),
          ...other
        },
        {
          // description: `${summaryModeLabel}`
        }
      );
    });
}


/** ###########################################################################
 * DataNode var + ref groups
 * ##########################################################################*/

/**
 * Groups by:
 * firstVarName → refId → dataNodeId.
 * 
 * @param {ProgramDependencyGraph} pdg
 * @param {number[]} dataNodeIds
 */
export function renderRefGroups(pdg, timelineNodes, getRefIdCb) {
  const { dp } = pdg;
  const items = timelineNodes
    .filter(timelineNode => timelineNode.dataNodeId && getRefIdCb(timelineNode))
    .map(timelineNode => {
      const refId = getRefIdCb(timelineNode);
      const firstAccessDataNode = dp.util.findRefFirstAccessDataNode(refId);
      const varName = dp.util.getDataNodeVarAccessName(firstAccessDataNode.nodeId);
      const staticContext = dp.util.getTraceStaticContext(firstAccessDataNode.traceId);
      const dataNode = dp.util.getDataNode(timelineNode.dataNodeId);
      return {
        timelineNode,
        refId,
        dataNode,
        staticContext,
        staticContextId: staticContext.staticContextId,
        varName,
        varDataNode: firstAccessDataNode,
        varDataNodeId: firstAccessDataNode.nodeId,
      };
    });

  return groupBySorted(items, 'staticContextId')
    .sort((a, b) => a[0].varDataNodeId - b[0].varDataNodeId)
    .map((ofStaticContext) => {
      return mkTreeItem(
        truncateStringShort(makeStaticContextLabel(ofStaticContext[0].staticContextId, dp.application)),
        () => groupBySorted(ofStaticContext, 'varName')
          .sort((a, b) => {
            return a[0].varDataNodeId - b[0].varDataNodeId;
          })
          .map(ofVar => {
            return mkTreeItem(
              ofVar[0].varName,
              () => groupBySorted(ofVar, 'refId').map(ofRefId => {
                const refItem = ofRefId[0];
                const refTrace = dp.util.getTraceOfDataNode(refItem.varDataNode.nodeId);
                const usedNames = Array.from(new Set(ofRefId
                  .map(item => dp.util.getDataNodeVarAccessName(item.dataNode.nodeId))
                  .filter(Boolean)
                ))
                  .join(', ');
                return mkTreeItem(
                  `Ref as: ${usedNames}`,
                  () => {
                    return ofRefId.map(item => renderPDGNode(pdg, item.timelineNode));
                  },
                  {
                    description: `(${ofRefId.length})`,
                    handleClick() {
                      traceSelection.selectTrace(refTrace);
                    }
                  }
                );
              }),
              {
                description: `(${new Set(ofVar.map(i => i.refId)).size} refs, ${ofVar.length} nodes)`,
                handleClick() {
                  const trace = dp.util.getTrace(ofVar[0].varDataNode.traceId);
                  traceSelection.selectTrace(trace);
                }
              }
            );
          }),
        {
          description: `(${ofStaticContext.length}) @${makeStaticContextLocLabel(dp.application.applicationId, ofStaticContext[0].staticContextId)}`,
          handleClick() {
            const trace = dp.util.getTrace(ofStaticContext[0].varDataNode.traceId);
            traceSelection.selectTrace(trace);
          }
        }
      );
    });
}

/**
 * Groups by:
 * firstVarName → refId → dataNodeId.
 * 
 * @param {ProgramDependencyGraph} pdg
 * @param {number[]} dataNodeIds
 */
export function renderVarGroups(pdg, timelineNodes) {
  // truncateStringShort(dp.util.getStaticTraceDeclarationVarName(group.declarationStaticTraceId)),
  // const summarizableVars = makeGroups(
  //   'declarationStaticTraceId',
  //   summarizableNodes.map(timelineNode => {
  //     const declarationTid = dp.util.getDataNodeAccessedDeclarationTid(timelineNode.dataNodeId);
  //     if (!declarationTid) {
  //       return null;
  //     }
  //     const declarationStaticTraceId = dp.util.getTrace(declarationTid).staticTraceId;
  //     return makeWriteEntry(timelineNode, {
  //       declarationStaticTraceId,
  //       declarationTid,
  //     });
  //   }).filter(Boolean)
  // );

  const { dp } = pdg;
  const items = timelineNodes
    .filter(timelineNode => dp.util.getDataNodeAccessedDeclarationTid(timelineNode.dataNodeId))
    .map(timelineNode => {
      const declarationTid = dp.util.getDataNodeAccessedDeclarationTid(timelineNode.dataNodeId);
      const staticDeclarationTid = dp.util.getStaticTraceId(declarationTid);
      const varName = dp.util.getStaticTraceDeclarationVarName(staticDeclarationTid);
      const staticContext = dp.util.getTraceStaticContext(declarationTid);
      const dataNode = dp.util.getDataNode(timelineNode.dataNodeId);
      return {
        timelineNode,
        declarationTid,
        staticDeclarationTid,
        dataNode,
        staticContext,
        staticContextId: staticContext.staticContextId,
        varName,
      };
    });

  return {
    items,
    groups: groupBySorted(items, 'staticContextId').map((ofStaticContext) => {
      return mkTreeItem(
        truncateStringShort(makeStaticContextLabel(ofStaticContext[0].staticContextId, dp.application)),
        () => groupBySorted(ofStaticContext, 'staticDeclarationTid')
          .map(ofVar => {
            return mkTreeItem(
              ofVar[0].varName,
              () => {
                return ofVar.map(item => renderPDGNode(pdg, item.timelineNode));
              },
              {
                description: `(${new Set(ofVar.map(i => i.staticDeclarationTid)).size} vars, ${ofVar.length} nodes)`,
                handleClick() {
                  const trace = dp.util.getTrace(ofVar[0].declarationTid);
                  traceSelection.selectTrace(trace);
                }
              }
            );
          }),
        {
          collapsibleState: TreeItemCollapsibleState.Expanded,
          description: `(${ofStaticContext.length}) @${makeStaticContextLocLabel(dp.application.applicationId, ofStaticContext[0].staticContextId)}`,
          handleClick() {
            const trace = dp.util.getTrace(ofStaticContext[0].declarationTid);
            traceSelection.selectTrace(trace);
          },
        }
      );
    })
  };
}
