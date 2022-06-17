import size from 'lodash/size';
import isNumber from 'lodash/isNumber';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import DataDependencyGraph from '@dbux/data/src/ddg/DataDependencyGraph';
import DDGSummaryMode from '@dbux/data/src/ddg/DDGSummaryMode';
import traceSelection from '@dbux/data/src/traceSelection';
import makeTreeItem, { makeTreeItems, makeTreeChildren, objectToTreeItems } from '../helpers/makeTreeItem';
import { renderDataNode, selectDataNodeOrTrace } from './dataTreeViewUtil';

/**
 * @param {DDGTimelineNode} node 
 */
export function renderNodeTree(ddg, node, cfg) {
  const { predicate, propsFactory } = cfg || EmptyObject;
  const { timelineNodes } = ddg;
  if (!node) {
    return makeTreeItem('(null)'); // DDG build has a bug?
  }
  const { children: childrenIds = EmptyArray } = node;
  const children = new childrenIds.constructor();
  Object.entries(childrenIds).forEach(([key, childId]) => {
    const childNode = timelineNodes[childId];
    if (predicate?.(childNode)) {
      // add child
      children[key] = renderNodeTree(ddg, childNode, cfg);
    }
  });
  const props = propsFactory?.(node, children) || EmptyObject;
  const nodeItem = renderDDGNode(ddg, node, children, props);

  nodeItem.id = node.label + '#' + Math.random() + ''; // hackfix
  return nodeItem;
}

function nodeTypeLabel(node) {
  return node.constructor.name.replace('TimelineNode', '');
}

/** ###########################################################################
 * nodes
 *  #########################################################################*/

export function makeDDGNodeDescription(ddg, node) {
  const { summaryModes } = ddg;
  const { timelineId, dataNodeId, connected, constructor, watched, og } = node;

  const con = connected ? '🔗' : ' ';
  const dataInfo = dataNodeId ? ` (n${dataNodeId})` : '';
  const summaryMode = summaryModes[timelineId];
  // eslint-disable-next-line no-nested-ternary
  const summaryModeLabel =
    watched ?
      'Watched' :
      summaryMode ?
        DDGSummaryMode.nameFrom(summaryMode) :
        og ?
          '(unknown)' :
          'SummaryNode';
  return `${con}${timelineId}${dataInfo} [${nodeTypeLabel(node)}] ${summaryModeLabel}`;
}

export function makeDDGNodeLabel(ddg, timelineId) {
  const node = ddg.timelineNodes[timelineId];
  return node.label || `${nodeTypeLabel(node)}`;
}

/**
 * @param {DataDependencyGraph} ddg
 * @param {DDGTimelineNode} node 
 */
export function renderDDGNode(ddg, node, children = null, moreProps = EmptyObject, labelPrefix = '') {
  const { dp } = ddg;
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
  const label = labelOverride || makeDDGNodeLabel(ddg, node.timelineId);

  if (!children) {
    children = node;
  }
  if (children === node) {
    // better rendering of things
    children = { ...node };

    const nodeChildren = children.children || EmptyArray;
    children.children = renderDDGNodesItem(ddg, nodeChildren, 'Children');
    if (children.parentNodeId) {
      children.parentNodeId = renderDDGNode(ddg, ddg.timelineNodes[children.parentNodeId], null, EmptyObject, 'Parent: ');
    }

    if (node.dataNodeId) {
      children.dataNode = renderDataNode(dp, node.dataNodeId, null, 'DataNode');
      delete children.dataNodeId;
    }

    // add edges
    children.Edges = makeTreeItems(
      renderEdgeIds(ddg, ddg.inEdgesByTimelineId[node.timelineId], 'EdgesIn'),
      renderEdgeIds(ddg, ddg.outEdgesByTimelineId[node.timelineId], 'EdgesOut'),
      renderOgEdgeIds(ddg, ddg.og.inEdgesByTimelineId[node.timelineId], 'OG Edges In'),
      renderOgEdgeIds(ddg, ddg.og.outEdgesByTimelineId[node.timelineId], 'OG Edges Out')
    );

    // TODO: also get control group by decision etc.
    // TODO: add *correct* value string (see DotBuilder.makeNodeValueString)
  }

  return makeTreeItem(
    labelPrefix + label,
    children,
    {
      description: makeDDGNodeDescription(ddg, node),
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

export function renderDDGNodesItem(ddg, nodesOrIds, label) {
  return makeTreeItem(() => ({
    label,
    children() {
      const children = new nodesOrIds.constructor();
      Object.entries(nodesOrIds).forEach(([key, childOrChildId]) => {
        let child;
        if (isNumber(childOrChildId)) {
          child = ddg.timelineNodes[childOrChildId];
        }
        else {
          child = childOrChildId;
        }
        children[key] = renderDDGNode(ddg, child);
      });
      return makeTreeChildren(children);
      // return Object.values(nodes).map((node) => {
      //   // const { timelineId, label: nodeLabel } = node;
      //   // delete entry.timelineId;
      //   return renderDDGNode(ddg, node, node);
      // });
    },
    props: {
      description: `(${size(nodesOrIds)})`
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

/**
 * @param {DataDependencyGraph} ddg
 */
export function renderEdgeIds(ddg, edgeIds, label) {
  return renderEdges(ddg, edgeIds?.map(edgeId => ddg.edges[edgeId]), label);
}

/**
 * @param {DataDependencyGraph} ddg
 */
export function renderOgEdgeIds(ddg, edgeIds, label) {
  return renderEdges(ddg, edgeIds?.map(edgeId => ddg.og.edges[edgeId]), label);
}

/**
 * @param {DataDependencyGraph} ddg
 */
export function renderEdges(ddg, edges, label = null, nodeDescription = null) {
  const { timelineNodes, dp } = ddg;
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
          renderDDGNode(ddg, fromNode, fromNode, {}, 'from: '),
          renderDDGNode(ddg, toNode, toNode, {}, 'to: '),
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
 * @param {DDGNodeSummary} summaries 
 */
export function renderDDGSummaries(ddg, summaries) {
  const { timelineNodes } = ddg;
  return Object.entries(summaries).map(([timelineId, summary]) => {
    const {
      summaryRoots,
      snapshotsByRefId
    } = summary;
    const node = timelineNodes[timelineId];
    return makeTreeItem(node.label,
      {
        node: renderDDGNode(ddg, node),
        roots: summaryRoots.map(rootId => {
          const root = timelineNodes[rootId];
          return renderNodeTree(ddg, root);
        }),
        snapshotsByRefId
      },
      {
        // description: `${summaryModeLabel}`
      }
    );
  });
}
