import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import DataDependencyGraph from '@dbux/data/src/ddg/DataDependencyGraph';
import DDGSummaryMode from '@dbux/data/src/ddg/DDGSummaryMode';
import traceSelection from '@dbux/data/src/traceSelection';
import makeTreeItem, { makeTreeItems, objectToTreeItems } from '../helpers/makeTreeItem';

/**
 * @param {DDGTimelineNode} node 
 */
export function renderNodeTree(ddg, node) {
  const { timelineNodes } = ddg;
  if (!node) {
    return makeTreeItem('(null)'); // DDG build has a bug
  }
  const { children: childrenIds = EmptyArray } = node;
  const children = new childrenIds.constructor();
  Object.entries(childrenIds).forEach(([key, childId]) => {
    const childNode = timelineNodes[childId];
    children[key] = renderNodeTree(ddg, childNode);
  });
  return renderDDGNode(ddg, node, children);
}

export function makeDDGNodeDescription(ddg, node) {
  const { summaryModes } = ddg;
  const { timelineId, constructor, watched, og } = node;
  const summaryMode = summaryModes[timelineId];
  // eslint-disable-next-line no-nested-ternary
  const summaryModeLabel =
    watched ?
      'Watched' :
      summaryMode ?
        DDGSummaryMode.nameFrom(summaryMode) :
        og ?
          '(unknown)' :
          'Summary Node';
  return `${timelineId} [${constructor.name}] ${summaryModeLabel}`;
}

export function makeDDGNodeLabel(ddg, timelineId) {
  const node = ddg.timelineNodes[timelineId];
  return node.label || `${node.constructor.name}`;
}

export function renderDataNode(ddg, dataNodeId) {
  const { dp } = ddg;
  const dataNode = dp.util.getDataNode(dataNodeId);
  return makeTreeItem(
    // 'dataNode',
    dp.util.getDataNodeValueStringShort(dataNodeId),
    dataNode,
    {
      description: `${dataNodeId}, refId=${dataNode.refId}, value=${dataNode.value}`
    }
  );
}

/**
 * @param {DataDependencyGraph} ddg
 * @param {DDGTimelineNode} node 
 */
export function renderDDGNode(ddg, node, children = node, moreProps = EmptyObject, labelPrefix = '') {
  const { dp } = ddg;
  const labelOverride = moreProps.label;
  if ('label' in moreProps) {
    delete moreProps.label;
  }
  const label = labelOverride || makeDDGNodeLabel(ddg, node.timelineId);
  if (children === node) {
    // some default customized rendering
    children = { ...node };
    if (node.dataNodeId) {
      children.dataNode = renderDataNode(ddg, node.dataNodeId);
      delete children.dataNodeId;
    }
    const out = ddg.outEdgesByTimelineId[node.timelineId];
  }

  // TODO: add value string (see DotBuilder.makeNodeValueString)

  return makeTreeItem(labelPrefix + label, children, {
    description: makeDDGNodeDescription(ddg, node),
    handleClick() {
      // select
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

export function renderEdgeIds(ddg, edgeIds) {
  // TODO
}

export function renderEdges(ddg, edges, nodeLabel = null, nodeDescription = null) {
  const { timelineNodes, dp } = ddg;
  return {
    label: nodeLabel,
    children() {
      return edges.map((edge) => {
        let { from, to, ...entry } = edge;
        const fromNode = timelineNodes[from];
        const toNode = timelineNodes[to];
        const label = `${fromNode?.label} -> ${toNode?.label}`;
        const children = makeTreeItems(
          renderDDGNode(ddg, fromNode, fromNode, {}, 'from: '),
          renderDDGNode(ddg, toNode, toNode, {}, 'to: '),
          ...objectToTreeItems(entry)
        );
        return makeTreeItem(label, children, {
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
      description: nodeDescription || `(${edges.length})`
    }
  };
}

export function renderDDGNodes(ddg, nodes) {
  return {
    children: nodes.map((node) => {
      // const { timelineId, label: nodeLabel } = node;
      // delete entry.timelineId;
      return renderDDGNode(ddg, node, node);
    }),
    props: {
      description: `(${nodes.length})`
    }
  };
}

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
