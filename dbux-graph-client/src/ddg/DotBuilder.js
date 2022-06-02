import ddgQueries, { RenderState } from '@dbux/data/src/ddg/ddgQueries';
import DDGTimelineNodeType, { isControlGroupTimelineNode, isDataTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { RootTimelineId } from '@dbux/data/src/ddg/constants';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DotBuilder');

const Verbose = 1;

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

  makeLabel(node) {
    // TODO: proper dot label encoding (it is probably not JSON)
    return `label=${JSON.stringify(node.label)}`;
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
    Verbose && debug(`fragment`, s);
    this.fragments.push(this.indent + s);
  }

  command = (s) => {
    this.fragment(s + ';');
  }

  /** ###########################################################################
   * build
   * ##########################################################################*/

  build() {
    this.indentLevel = 0;
    this.buildRoot();
    return this.compileFragments();
  }

  buildRoot() {
    const { root, renderState: { edges } } = this;

    this.fragment('digraph {');
    this.indentLevel += 1;

    // global settings
    // `node [fontsize=9]`,
    this.command('edge [arrowsize=0.5,arrowhead="open"]');
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
      if (
        // TODO: move this check to DDG (on host)
        this.doc.state.connectedOnlyMode &&
        !isControlGroupTimelineNode(node.type) &&
        !node.connected
      ) {
        continue;
      }
      this.node(node);
    }
  }

  node(node) {
    // const isSummarized = ddgQueries.isNodeSummarized(this.renderState, node);
    // if (isSummarized) {
    //   // hackfix: summary (TODO: make sure, in the new version, we don't have repeating loops like this)
    //   // → here, we treat the original node (`el`) as a group node
    //   // → in the new version, we probably want to explicitly add a `subgraph` (and put this logic in a dedicated function)
    //   const summary = this.renderState.nodeSummaries[node.timelineId];
    // }

    if (ddgQueries.isExpandedGroupNode(this.renderState, node)) {
      return this.group(node);
    }
    else if (ddgQueries.isExpandedSnapshot(this.renderState, node)) {
      return this.refSnapshotNode(node);
    }
    else {
      return this.valueNode(node);
    }
  }

  label(node) {
    this.command(this.makeLabel(node));
  }

  group(node) {
    const { timelineId } = node;

    this.fragment(`subgraph cluster_group_${timelineId} {`);
    this.indentLevel += 1;
    this.label(node);
    this.nodesByIds(node.children);
    this.indentLevel -= 1;
    this.fragment(`}`);
  }

  refSnapshotNode(node) {
    const { timelineId } = node;

    this.fragment(`subgraph cluster_ref_${timelineId} {`);
    this.indentLevel += 1;
    // this.label(node);
    this.snapshotRecord(node);
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
    this.command(`${this.makeNodeId(node)} [${this.makeLabel(node)}]`);
  }

  buildEdge(edge) {
    this.command(`${edge.from} -> ${edge.to}`);
  }
}