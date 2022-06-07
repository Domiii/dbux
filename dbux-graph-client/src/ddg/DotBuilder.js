import ddgQueries, { RenderState } from '@dbux/data/src/ddg/ddgQueries';
import DDGTimelineNodeType, { isControlGroupTimelineNode, isDataTimelineNode, isRepeatedRefTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { RootTimelineId } from '@dbux/data/src/ddg/constants';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import { makeSummaryLabel } from './ddgDomUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DotBuilder');

const Verbose = 1;

// future-work: use theme colors via CSS vars (to make it prettier + also support light theme)
//    → (see: https://stackoverflow.com/a/56759634)
const Colors = {
  /**
   * Default text
   */
  text: 'white',

  edgeText: 'gray',
  line: 'white',
  groupBorder: 'gray',

  groupLabel: 'yellow',
  snapshotSeparator: 'gray',
  snapshotProp: 'gray',

  value: 'lightblue'
};


export default class DotBuilder {
  _indentLevel;
  fragments = [];

  constructor(doc, renderState) {
    this.doc = doc;
    this.renderState = renderState;
  }

  get ddg() {
    return this.renderState;
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

  nodeIdAttr(timelineId) {
    return `id=${timelineId}`;
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
    this.command(`color="${Colors.groupBorder}"`);
    this.command(`fontcolor="${Colors.groupLabel}"`);
  }

  buildRoot() {
    const { root, renderState: { edges } } = this;

    this.fragment('digraph {');
    this.indentLevel += 1;

    // global settings
    this.command(`node[color="${Colors.line}", fontcolor="${Colors.text}"]`);
    // `node [fontsize=9]`,
    this.command(`edge[arrowsize=0.5, arrowhead="open", color="${Colors.line}", fontcolor="${Colors.edgeText}"]`);
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
      this.edge(edge);
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

  node(node, force = false) {
    const { ddg } = this;
    if (ddgQueries.isNodeSummarized(ddg, node)) {
      this.nodeSummary(node);
    }
    else if (ddgQueries.isExpandedGroupNode(ddg, node)) {
      this.controlGroup(node);
    }
    else if (ddgQueries.isSnapshot(ddg, node)) {
      this.refSnapshotRoot(node);
    }
    else if (force || ddgQueries.isVisible(ddg, node)) {
      this.valueNode(node);
    }
  }

  _groupAttrs(node) {
    // const { ddg } = this;
    const { timelineId, label } = node;
    this.command(this.nodeIdAttr(timelineId));
    // this.label(node.label || '');
    // NOTE: mode is hacked in in `decorateNode`

    // const mode = ddgQueries.getNodeSummaryMode(ddg, node);
    // const modeEl = makeSummaryLabel(ddg, mode);
    // ${modeEl}
    this.command(`label=<${label || '()'}>`);
    this.subgraphAttrs();
  }

  controlGroup(node) {
    const { timelineId, label } = node;

    this.fragment(`subgraph cluster_group_${timelineId} {`);
    this.indentLevel += 1;
    this._groupAttrs(node);

    this.nodesByIds(node.children);

    this.indentLevel -= 1;
    this.fragment(`}`);
  }

  nodeSummary(node) {
    const { ddg } = this;
    if (ddgQueries.doesNodeHaveSummary(ddg, node)) {
      // render summary nodes
      this.summaryGroup(node);
    }
    else {
      // render node as-is
      this.valueNode(node);
    }
  }

  summaryGroup(node) {
    const { ddg } = this;
    const { nodeSummaries } = ddg;

    const summary = nodeSummaries[node.timelineId];
    const roots = ddgQueries.getSummaryRoots(ddg, summary);
    const { timelineId } = node;
    this.fragment(`subgraph cluster_summary_${timelineId} {`);
    this.indentLevel += 1;
    this._groupAttrs(node);

    for (const root of roots) {
      this.node(root, true);
    }

    this.indentLevel -= 1;
    this.fragment(`}`);
  }

  /**
   * A root of a snapshot
   */
  refSnapshotRoot(node, label = null) {
    const { ddg } = this;
    const { timelineId } = node;

    this.fragment(`subgraph cluster_ref_${timelineId} {`);
    this.indentLevel += 1;
    const color = ddgQueries.isNestingSnapshot(ddg, node) ? 'gray' : 'transparent';
    this.command(`color="${color}"`);
    this.command(`fontcolor="${Colors.groupLabel}"`);
    this.command(this.nodeIdAttr(timelineId));
    this.label(label || '');

    this.snapshotTable(node);

    this.indentLevel -= 1;
    this.fragment(`}`);
  }

  valueNode(node) {
    if (node.varAccess || node.value !== node.label) { // hackfix heuristic
      // record
      this.nodeRecord(node);
    }
    else {
      // simple label
      const attrs = [this.nodeIdAttr(node.timelineId), `fontcolor="${Colors.value}"`, this.makeLabel(node.label)].join(',');
      this.command(`${this.makeNodeId(node)} [${attrs}]`);
    }
  }

  /**
   * Edge from nested reference DataNode to its own snapshot node.
   */
  snapshotEdge(node) {
    this.snapshotEdgeFromTo(this.makeNodeId(node), node.timelineId);
  }

  snapshotEdgeFromTo(from, to) {
    this.command(`${from} -> ${to} [arrowhead="odot", color="gray"]`);
  }

  edge(edge) {
    const from = this.makeNodeId(this.getNode(edge.from));
    const to = this.makeNodeId(this.getNode(edge.to));
    const debugInfo = Verbose && ` [label=${edge.edgeId}]` || '';
    this.command(`${from} -> ${to}${debugInfo}`);
  }

  /** ###########################################################################
   * values, records, tables, structs
   *  #########################################################################*/

  makeNodeValueString(node) {
    if (ddgQueries.isSnapshot(this.ddg, node)) {
      return Array.isArray(node.children) ? '[]' : '{}';
    }
    if (node.value !== undefined) {
      return JSON.stringify(node.value);
    }
    if (isRepeatedRefTimelineNode(node.type)) {
      return node.label;
    }
    if (node.refId) {
      return '📦';  // ref value node but without snapshot
    }
    return node.label || '?';
  }

  // makeRecordEntry(timelineId, label) {
  //   return `<${timelineId}> ${label}`;
  // }

  nodeRecord(node) {
    let { timelineId, label } = node;
    const value = this.makeNodeValueString(node);
    // TODO: use table instead, so we can have key + val rows

    // 5 [label="arr|<6> arr|<7> 0|<8> 1"];
    // const valueItem = this.makeRecordEntry(timelineId, value);
    // const l = this.makeLabel(`${label}|${valueItem}}`);
    const l = `label=<
<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0">
  <TR>
    <TD BORDER="1" SIDES="R">${label}</TD>
    <TD ID="${timelineId}" TITLE="${timelineId}"><FONT COLOR="${Colors.value}">${value}</FONT></TD>
  </TR>
</TABLE>
>`;
    const attrs = [this.nodeIdAttr(node.timelineId), `shape=record`, l].join(',');
    this.command(`${timelineId} [${attrs}]`);
  }

  // /**
  //  * @param {DDGTimelineNode} node 
  //  */
  // snapshotRecord(node) {
  //   let { timelineId, label, children } = node;
  //   // TODO: use table instead, so we can have key + val rows

  //   // 5 [label="arr|<6> arr|<7> 0|<8> 1"];
  //   label ||= 'arr';    // TODO: proper snapshot label (e.g. by first `declarationTid` of `ref`)
  //   const childrenItems = Object.entries(children)
  //     .map(([prop, nodeId]) => this.makeRecordEntry(nodeId, prop));
  //   const l = this.makeLabel(`${label}|${childrenItems.join('|')}`);
  //   this.command(`${timelineId} [${this.nodeIdAttr(timelineId)},${l}]`);
  // }

  /** ###########################################################################
   * snapshotTable
   *  #########################################################################*/

  /**
   * Produce snapshot table with prop and value for each entry.
   * @param {DDGTimelineNode} node
   * @see https://graphviz.org/doc/info/shapes.html#html-like-label-examples
   */
  snapshotTable(node) {
    const { ddg, ddg: { timelineNodes } } = this;
    // this.command(`node [shape=record]`);
    this.command(`node [shape=plaintext]`);

    const { timelineId, label, parentNodeId, children } = node;
    const hasLabel = !parentNodeId && label !== undefined;
    const childEntries = Object.entries(children);
    const childrenCells = childEntries
      .map(([prop, childId]) => this.makeTablePropValueCell(childId, prop))
      .join('');
    this.command(`${timelineId} [${this.nodeIdAttr(timelineId)},label=<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
  <TR>
    ${hasLabel ? `<TD ROWSPAN="2">${label}</TD>` : ''}
    ${childrenCells}
  </TR>
</TABLE>
>]`);

    for (const [prop, childId] of childEntries) {
      const child = timelineNodes[childId];
      if (ddgQueries.isSnapshot(ddg, child)) {
        // add child snapshot
        this.snapshotTable(child);

        // add edge
        this.snapshotEdge(child);
      }
      else if (child.repeatedTimelineId) {
        const repeatedNode = timelineNodes[child.repeatedTimelineId];
        this.snapshotEdgeFromTo(this.makeNodeId(child), this.makeNodeId(repeatedNode));
      }
    }
  }

  /**
   * Build a row of "column" cells containing tables.
   * We do this, so every node's column has a singular addressable PORT.
   */
  makeTablePropValueCell(timelineId, prop) {
    const { timelineNodes } = this.renderState;
    const node = timelineNodes[timelineId];
    return `<TD ID="${timelineId}" TITLE="${timelineId}" ROWSPAN="2" PORT="${timelineId}">
      <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0">
        <TR><TD BORDER="1" SIDES="B" COLOR="${Colors.snapshotSeparator}"><FONT COLOR="${Colors.snapshotProp}">${prop}</FONT></TD></TR>
        <TR><TD><FONT COLOR="${Colors.value}">${this.makeNodeValueString(node)}</FONT></TD></TR>
      </TABLE>
    </TD>`;
  }
}
