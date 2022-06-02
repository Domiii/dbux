import ddgQueries, { RenderState } from '@dbux/data/src/ddg/ddgQueries';
import DDGTimelineNodeType, { isControlGroupTimelineNode, isDataTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { RootTimelineId } from '@dbux/data/src/ddg/constants';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DotBuilder');

const Verbose = 1;

// future-work: use theme colors via CSS vars (to make it prettier + also support light theme)
//    → (see: https://stackoverflow.com/a/56759634)
const DotCfg = {
  textColor: 'white',
  edgeTextColor: 'gray',
  lineColor: 'white',
  groupBorderColor: 'gray',
  groupLabelColor: 'gray'
};


export default class DotBuilder {
  _indentLevel;
  fragments = [];

  constructor(doc, renderState) {
    this.doc = doc;
    this.renderState = renderState;
  }

  get root() {
    return this.renderState.timelineNodes?.[RootTimelineId];
  }

  getNode(timelineId) {
    return this.renderState.timelineNodes[timelineId];
  }

  /**
   * @param {DDGTimelineNode} node 
   */
  isRootNode(node) {
    return this.root === node;
  }

  /**
   * @param {DDGTimelineNode} node 
   */
  makeNodeId(node) {
    if (node.parentNodeId) {
      // NOTE: this is required for RefSnapshot structure nodes to be addressable
      return `${node.parentNodeId}:${node.timelineId}`;
    }
    return node.timelineId;
  }

  makeLabel(text) {
    // TODO: proper dot label encoding (it is probably not JSON)
    return `label=${JSON.stringify(text)}`;
  }

  /** ###########################################################################
   * indent, lines + fragments
   * ##########################################################################*/

  get indentLevel() {
    return this._indentLevel;
  }

  set indentLevel(val) {
    this._indentLevel = val;
    this.indent = '  '.repeat(this.indentLevel);
  }

  compileFragments() {
    return this.fragments.join('\n');
  }

  fragment = (s) => {
    // Verbose && debug(`fragment`, s);
    this.fragments.push(this.indent + s);
  }

  command = (s) => {
    this.fragment(s + ';');
  }

  label = s => {
    this.command(this.makeLabel(s));
  }

  /** ###########################################################################
   * build
   * ##########################################################################*/

  build() {
    this.indentLevel = 0;
    this.buildRoot();
    return this.compileFragments();
  }

  /**
   * attrs that apply to graph and all subgraphs.
   */
  subgraphAttrs() {
    this.command(`color="${DotCfg.groupBorderColor}"`);
    this.command(`fontcolor="${DotCfg.groupLabelColor}"`);
  }

  buildRoot() {
    const { root, renderState: { edges } } = this;

    this.fragment('digraph {');
    this.indentLevel += 1;

    // global settings
    this.command(`node[color="${DotCfg.lineColor}", fontcolor="${DotCfg.textColor}"]`);
    // `node [fontsize=9]`,
    this.command(`edge[arrowsize=0.5, arrowhead="open", color="${DotCfg.lineColor}", fontcolor="${DotCfg.edgeTextColor}"]`);
    this.command(`labeljust=l`); // graph/cluster label left justified
    this.subgraphAttrs();

    this.nodesByIds(root.children);

    // NOTE: edges should be placed after all nodes have been defined, else things will not get rendered in the right places/groups
    // const edgeIds = childNodes.flatMap(childNode => outEdgesByTimelineId[childNode.timelineId] || EmptyArray);
    // const edges = edgeIds
    //   .map(edgeId => {
    //     return edges[edgeId];
    //   });
    for (const edge of edges) {
      if (!edge) continue;
      this.buildEdge(edge);
    }

    this.indentLevel -= 1;

    this.fragment('}');
  }

  nodesByIds(nodeIds) {
    const { timelineNodes } = this.renderState;
    for (const nodeId of nodeIds || EmptyArray) {
      const node = timelineNodes[nodeId];
      this.node(node);
    }
  }

  nodeLabel(node) {
    this.label(node.label);
  }

  node(node) {
    const ddg = this.renderState;
    if (ddgQueries.isNodeSummarized(ddg, node)) {
      this.nodeSummary(node);
    }
    else if (ddgQueries.isExpandedGroupNode(ddg, node)) {
      this.controlGroup(node);
    }
    else if (ddgQueries.isSnapshot(ddg, node)) {
      this.refSnapshotNode(node);
    }
    else if (ddgQueries.isVisible(ddg, node)) {
      this.valueNode(node);
    }
  }

  controlGroup(node) {
    const { timelineId } = node;

    this.fragment(`subgraph cluster_group_${timelineId} {`);
    this.indentLevel += 1;
    this.subgraphAttrs();
    this.nodeLabel(node);
    this.nodesByIds(node.children);
    this.indentLevel -= 1;
    this.fragment(`}`);
  }

  nodeSummary(node) {
    const { renderState } = this;
    const { nodeSummaries } = renderState;

    const summary = nodeSummaries[node.timelineId];
    const roots = ddgQueries.getSummaryRoots(renderState, summary);
    if (roots?.length) {
      this.refSnapshotNode(roots, node.label);
    }
    else {
      // render node as-is
      this.valueNode(node);
    }
  }

  refSnapshotNode(nodesOrNode, label = null) {
    const isGroupOfSnapshots = Array.isArray(nodesOrNode);
    const first = isGroupOfSnapshots ? nodesOrNode[0] : nodesOrNode;
    const { timelineId } = first;

    this.fragment(`subgraph cluster_ref_${timelineId} {`);
    this.indentLevel += 1;
    if (isGroupOfSnapshots) {
      this.command(`color="${DotCfg.groupBorderColor}"`);
    }
    else {
      this.command(`color="transparent"`);
    }
    this.command(`fontcolor="${DotCfg.groupLabelColor}"`);
    label && this.label(label);
    this.command(`node [shape=record]`);

    if (isGroupOfSnapshots) {
      for (const node of nodesOrNode) {
        this.snapshotRecord(node);
      }
    }
    else {
      this.snapshotRecord(nodesOrNode);
    }

    this.indentLevel -= 1;
    this.fragment(`}`);
  }

  makeRecordEntry(key, nodeId) {
    const { timelineId } = this.renderState.timelineNodes[nodeId];
    return `<${timelineId}> ${key}`;
  }

  snapshotRecord(node) {
    let { timelineId, label, children } = node;
    // TODO: use table instead, so we can have key + val rows

    // 5 [label="arr|<6> arr|<7> 0|<8> 1"];
    label ||= 'arr';    // TODO: proper snapshot label (e.g. by first `declarationTid` of `ref`)
    const childrenItems = Object.entries(children)
      .map(([key, nodeId]) => this.makeRecordEntry(key, nodeId));
    this.command(`${timelineId} [label="${label}|${childrenItems.join('|')}"]`);
  }

  valueNode(node) {
    this.command(`${this.makeNodeId(node)} [${this.makeLabel(node.label)}]`);
  }

  buildEdge(edge) {
    const from = this.makeNodeId(this.getNode(edge.from));
    const to = this.makeNodeId(this.getNode(edge.to));
    const debugInfo = Verbose && ` [label=${edge.edgeId}]` || '';
    this.command(`${from} -> ${to}${debugInfo}`);
  }
}