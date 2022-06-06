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
const Colors = {
  /**
   * Default text
   */
  text: 'white',

  edgeText: 'gray',
  line: 'white',
  groupBorder: 'gray',
  groupLabel: 'gray',
  snapshotSeparator: 'gray',
  snapshotProp: 'gray',
  snapshotValue: 'white'
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

  node(node, force = false) {
    const ddg = this.renderState;
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

  controlGroup(node) {
    const { timelineId } = node;

    this.fragment(`subgraph cluster_group_${timelineId} {`);
    this.command(this.nodeIdAttr(timelineId));
    this.label(node.label || '');
    this.indentLevel += 1;
    this.subgraphAttrs();

    this.nodesByIds(node.children);

    this.indentLevel -= 1;
    this.fragment(`}`);
  }

  nodeSummary(summaryNode) {
    const { renderState } = this;
    const { nodeSummaries } = renderState;

    const summary = nodeSummaries[summaryNode.timelineId];
    const roots = ddgQueries.getSummaryRoots(renderState, summary);
    if (roots?.length) {
      // render summary nodes
      this.summaryGroup(summaryNode, roots, summaryNode.label);
    }
    else {
      // render node as-is
      this.valueNode(summaryNode);
    }
  }

  summaryGroup(summaryNode, nodes, label = null) {
    const { timelineId } = summaryNode;
    this.fragment(`subgraph cluster_summary_${timelineId} {`);
    this.indentLevel += 1;
    this.command(`color="${Colors.groupBorder}"`);
    this.command(`fontcolor="${Colors.groupLabel}"`);
    this.command(this.nodeIdAttr(timelineId));
    label && this.label(label);

    for (const node of nodes) {
      this.node(node, true);
    }

    this.indentLevel -= 1;
    this.fragment(`}`);
  }

  /**
   * A root of a snapshot
   */
  refSnapshotRoot(node, label = null) {
    const { timelineId } = node;

    this.fragment(`subgraph cluster_ref_${timelineId} {`);
    this.indentLevel += 1;
    this.command(`color="transparent"`);
    this.command(`fontcolor="${Colors.groupLabel}"`);
    this.command(this.nodeIdAttr(timelineId));
    this.label(label || '');

    this.snapshotTable(node);

    this.indentLevel -= 1;
    this.fragment(`}`);
  }

  valueNode(node) {
    // this.command(`${this.makeNodeId(node)} [${this.nodeIdAttr(node.timelineId)},${this.makeLabel(node.label)}]`);
    this.dataNodeRecord(node);
  }

  buildEdge(edge) {
    const from = this.makeNodeId(this.getNode(edge.from));
    const to = this.makeNodeId(this.getNode(edge.to));
    const debugInfo = Verbose && ` [label=${edge.edgeId}]` || '';
    this.command(`${from} -> ${to}${debugInfo}`);
  }

  /** ###########################################################################
   * records, tables + structs
   *  #########################################################################*/


  makeRecordEntry(timelineId, label) {
    return `<${timelineId}> ${label}`;
  }

  dataNodeRecord(node) {
    let { timelineId, label, value } = node;
    // TODO: use table instead, so we can have key + val rows

    // 5 [label="arr|<6> arr|<7> 0|<8> 1"];
    const valueItem = this.makeRecordEntry(timelineId, value);
    this.command(`${timelineId} [${this.nodeIdAttr(timelineId)},shape=record,label="${label}|${valueItem}}"]`);
  }

  /**
   * @param {DDGTimelineNode} node 
   */
  snapshotRecord(node) {
    let { timelineId, label, children } = node;
    // TODO: use table instead, so we can have key + val rows

    // 5 [label="arr|<6> arr|<7> 0|<8> 1"];
    label ||= 'arr';    // TODO: proper snapshot label (e.g. by first `declarationTid` of `ref`)
    const childrenItems = Object.entries(children)
      .map(([prop, nodeId]) => this.makeRecordEntry(nodeId, prop));
    this.command(`${timelineId} [${this.nodeIdAttr(timelineId)},label="${label}|${childrenItems.join('|')}"]`);
  }

  /** ###########################################################################
   * tables
   *  #########################################################################*/

  /**
   * Produce snapshot table with prop and value for each entry.
   * @param {DDGTimelineNode} node
   * @see https://graphviz.org/doc/info/shapes.html#html-like-label-examples
   */
  snapshotTable(node) {
    // this.command(`node [shape=record]`);
    this.command(`node [shape=plaintext]`);

    const { timelineId, label, children } = node;
    const childrenCells = Object.entries(children)
      .map(([prop, childId]) => this.makeTablePropValueCell(childId, prop))
      .join('');
    this.command(`${timelineId} [${this.nodeIdAttr(timelineId)},label=<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
  <TR>
    <TD ROWSPAN="2">${label}</TD>
    ${childrenCells}
  </TR>
</TABLE>
>]`);
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
        <TR><TD><FONT COLOR="${Colors.snapshotValue}">${node.value}</FONT></TD></TR>
      </TABLE>
    </TD>`;
  }
}