import isEmpty from 'lodash/isEmpty';
import ddgQueries, { RenderState } from '@dbux/data/src/ddg/ddgQueries';
import DDGTimelineNodeType, { isControlGroupTimelineNode, isDataTimelineNode, isRepeatedRefTimelineNode } from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { DDGRootTimelineId } from '@dbux/data/src/ddg/constants';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { newLogger } from '@dbux/common/src/log/logger';
import DDGEdgeType from '@dbux/data/src/ddg/DDGEdgeType';
import UniqueRefId from '@dbux/common/src/types/constants/UniqueRefId';
import { truncateStringDefault } from '@dbux/common/src/util/stringUtil';
import { makeSummaryLabel } from './ddgDomUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DotBuilder');

const Verbose = 1;


/** ###########################################################################
 * Util
 * ##########################################################################*/

/**
 * @see https://stackoverflow.com/a/18750001
 */
function dotEncode(s) {
  return (s + '').replace(/[\u00A0-\u9999<>&|{}()[\]]/g, function (c) {
    return '&#' + c.charCodeAt(0) + ';';
  });
  // /**
  //  * @see https://stackoverflow.com/a/29482788
  //  */
  // converter.textContent = s;
  // return converter.innerHTML;
}

function fixProp(prop) {
  if (prop.includes(UniqueRefId)) {
    return '{}';
  }
  return prop;
}

/** ###########################################################################
 * Colors + Cfg
 * ##########################################################################*/

// future-work: use theme colors via CSS vars (to make it prettier + also support light theme)
//    → (see: https://stackoverflow.com/a/56759634)
/**
 * NOTE: colors have RGBA support (e.g. `bg`)
 */
const Colors = {
  bg: '#0000001A',

  /**
   * Default text
   */
  text: 'white',

  edgeText: 'gray',
  line: 'white',
  nodeOutlineDefault: 'white',
  watchedNodeOutline: 'green',
  edge: '#AAAAAA',
  groupBorder: 'gray',

  groupLabel: 'yellow',
  snapshotSeparator: 'gray',
  snapshotProp: 'gray',

  deleteValue: 'red',
  deleteEdge: 'red',

  value: 'lightblue',
};

const RenderConfig = {
  /**
   * Applies this weight to the invisible edges for `extraVertical` mode.
   * @see https://graphviz.org/docs/attrs/weight/
   */
  extraVerticalWeight: 2
};


function trunc(s) {
  return truncateStringDefault(s, { length: 30 });
}

export default class DotBuilder {
  _indentLevel;
  fragments = [];

  constructor(doc, renderState) {
    this.doc = doc;
    this.renderState = renderState;
  }

  /** ###########################################################################
   * getters + generators
   * ##########################################################################*/

  get ddg() {
    return this.renderState;
  }

  get root() {
    return this.renderState.timelineNodes?.[DDGRootTimelineId];
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
    if (this.isPropRecordNode(node)) {
      // access the actual node via timelineId + prop
      return `${node.timelineId}:${node.varAccess.prop}`;
    }
    return node.timelineId;
  }

  wrapText(text) {
    text = trunc(text + '');
    return dotEncode(text);
  }

  makeLabel(text) {
    return `label="${this.wrapText(text)}"`;
  }

  /**
   * NOTE: this is pseudo (not real) HTML
   * @see https://graphviz.org/doc/info/shapes.html#html
   */
  makeLabelHtml(html) {
    return `label=<${html}>`;
  }

  nodeIdAttr(timelineId) {
    return `id=${timelineId}`;
  }

  nodeAttrs(timelineId, ...moreAttrs) {
    return [
      this.nodeIdAttr(timelineId),
      this.nodeOutlineColorAttr(timelineId),
      ...moreAttrs
    ]
      .filter(Boolean)
      .join(',');
  }

  nodeOutlineColor(timelineId) {
    const node = this.ddg.timelineNodes[timelineId];
    if (node.watched) {
      return `${Colors.watchedNodeOutline}`;
    }
    return null;
  }


  nodeOutlineColorAttr(timelineId) {
    const node = this.ddg.timelineNodes[timelineId];
    if (node.watched) {
      return `color="${Colors.watchedNodeOutline}"`;
    }
    return '';  // ignore → already taken care of
  }

  makeAttrs(...attrs) {
    return `[${attrs.filter(Boolean).join(',')}]`;
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
    // const extra = this.buildPullDownStructure().join('\n');
    return /* extra + '\n' + */ this.fragments.join('\n');
  }

  fragment = (s) => {
    // Verbose && debug(`fragment`, s);
    this.fragments.push(this.indent + s);
  }

  command = (s) => {
    if (!s) {
      return;
    }
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
    this.command(`bgcolor="${Colors.bg}"`);
    this.command(`node[color="${Colors.nodeOutlineDefault}", fontcolor="${Colors.text}"]`);
    // `node [fontsize=9]`,
    this.command(`edge[arrowsize=0.5, arrowhead="open", color="${Colors.edge}", fontcolor="${Colors.edgeText}"]`);
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

    // extra stuff
    this.buildPullDownStructure();

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
    const show = force || ddgQueries.isVisible(ddg, node);
    // console.debug(`node #${node.timelineId}, v=${show}, sum=${ddgQueries.isNodeSummarized(ddg, node)}, expgroup=${ddgQueries.isExpandedGroupNode(ddg, node)}`);
    if (ddgQueries.isNodeSummarized(ddg, node)) {
      this.nodeSummary(node);
    }
    else if (show) {
      if (ddgQueries.isExpandedGroupNode(ddg, node)) {
        this.controlGroup(node);
      }
      else if (ddgQueries.isSnapshot(ddg, node)) {
        this.refSnapshotRoot(node);
      }
      else if (ddgQueries.isDeleteNode(ddg, node)) {
        this.deleteNode(node);
      }
      else {
        this.valueNode(node);
      }
      this.addNodeToPullDownStructure(node);
    }
    else if (isControlGroupTimelineNode(node.type)) {
      // console.log(`Control group: ${node}, show=${show}, summary=${ddgQueries.getNodeSummaryMode(ddg, node)}`);
      // NOTE: this is to render Watched node inside of hidden groups
      this.nodesByIds(node.children);
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
    this.label(label || '()');
    this.subgraphAttrs();
  }

  controlGroup(node) {
    const { timelineId } = node;

    this.fragment(`subgraph cluster_group_${timelineId} {`);
    this.indentLevel += 1;
    this._groupAttrs(node);

    if (!isEmpty(node.children)) {
      this.nodesByIds(node.children);
    }
    else {
      // TODO: this hackfix will not work because often times, the group has children, but the children are not rendered
      // hackfix: we need to render something, or else group is not shown
      // this.command(`${node.timelineId} ${this.nodeAttrs(node.timelineId)}`);
    }

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
    const isNesting = ddgQueries.isNestingSnapshot(ddg, node);
    const color = !isNesting ?
      'transparent' : // only root has outer border
      node.watched ?
        Colors.watchedNodeOutline :
        'gray';
    this.command(`color="${color}"`);
    this.command(`fontcolor="${Colors.groupLabel}"`);
    this.command(this.nodeIdAttr(timelineId));
    this.label(label || '');

    this.snapshotTable(node, !isNesting && node.watched ? Colors.watchedNodeOutline : null);

    this.indentLevel -= 1;
    this.fragment(`}`);
  }

  deleteNode(node) {
    if (!node.varAccess) {
      // this should never happen
      this.valueNode(node, 'red');
    }
    if (node.varAccess) {
      // simple label
      const attrs = [
        this.nodeAttrs(node.timelineId),
        `color="${Colors.deleteValue}"`,
        `fontcolor="${Colors.deleteValue}"`,
        this.makeLabelHtml(`<S>${this.wrapText(node.label)}</S>`)
      ].join(',');
      this.command(`${this.makeNodeId(node)} [${attrs}]`);
    }
  }

  valueNode(node, colorOverride) {
    if (this.isNodeRecordNode(node)) {
      // record
      this.nodeRecord(node);
    }
    else {
      // simple label
      const attrs = [
        this.nodeAttrs(node.timelineId),
        `fontcolor="${colorOverride || Colors.value}"`,
        this.makeLabel(node.label)
      ].join(',');
      this.command(`${this.makeNodeId(node)} [${attrs}]`);
    }
  }

  /**
   * Edge from nested reference DataNode to its own snapshot node.
   */
  snapshotEdge(node) {
    this.snapshotEdgeFromTo(this.makeNodeId(node), node.timelineId);
  }

  edgeAttrs(edgeId) {
    return `id=e${edgeId}`;
  }

  snapshotEdgeFromTo(from, to) {
    this.command(`${from} -> ${to} [arrowhead="odot", color="gray"]`);
  }

  edge(edge) {
    const from = this.makeNodeId(this.getNode(edge.from));
    const to = this.makeNodeId(this.getNode(edge.to));
    const colorOverride = edge.type === DDGEdgeType.Delete ? `color=${Colors.deleteEdge}` : '';
    // const debugAttrs = Verbose && `${this.makeLabel(edge.edgeId)}` || '';
    const debugAttrs = '';
    const attrs = this.makeAttrs(
      colorOverride,
      debugAttrs,
      this.edgeAttrs(edge.edgeId)
    );
    this.command(`${from} -> ${to} ${attrs}`);
  }

  /** ###########################################################################
   * values, records, tables, structs
   *  #########################################################################*/

  makeNestedRefValueString(node) {
    if (node.repeatedTimelineId) {
      // render original instead
      node = this.ddg.timelineNodes[node.repeatedTimelineId];
    }

    if (!node.children) {
      return '📦';
    }

    let s = Object.values(node.children)
      .map(childId => {
        const child = this.ddg.timelineNodes[childId];
        if (child.value !== undefined) {
          return child.value;
        }
        return null;
      })
      .filter(Boolean)
      .join(', ');

    s = Array.isArray(node.children) ? `[${s}]` : `{${s}}`;
    return s;
  }

  makeNodeValueString(node) {
    let s;
    if (ddgQueries.isSnapshot(this.ddg, node)) {
      s = this.makeNestedRefValueString(node);
    }
    else if (isRepeatedRefTimelineNode(node.type)) {
      const linkNode = this.ddg.timelineNodes[node.repeatedTimelineId];
      s = this.makeNestedRefValueString(linkNode) + node.label;
    }
    else if (node.refId) {
      s = '📦';  // ref value node but without snapshot
    }
    else if (node.value !== undefined) {
      s = JSON.stringify(node.value);
    }
    else {
      // s = node.label || '?';
      s = node.value + '';
    }
    return this.wrapText(s);
  }

  // makeRecordEntry(timelineId, label) {
  //   return `<${timelineId}> ${label}`;
  // }

  /**
   * @param {DDGTimelineNode} node
   */
  isNodeRecordNode(node) {
    return ddgQueries.isSnapshot(this.ddg, node) ?
      isEmpty(node.children) :
      (!!node.varAccess || node.value !== node.label); // hackfix heuristic;
  }

  /**
   * This is a hackfix to deal with node adding "itself" as a child record.
   */
  isPropRecordNode(node) {
    return this.isNodeRecordNode(node) && node.varAccess?.prop !== undefined;
  }

  nodeRecord(node) {
    const { timelineId, label, varAccess } = node;
    const prop = varAccess?.prop;
    const value = this.makeNodeValueString(node);

    let l, attrs = [
      this.nodeAttrs(node.timelineId)
    ];
    if (this.isPropRecordNode(node)) {
      attrs.push(`shape=plaintext`);
      // record with prop + value
      // → has no ID itself. Child cell has ID instead.
      l = `<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
  <TR>
    <TD ROWSPAN="2">${this.wrapText(label || ' ')}</TD>
    ${this.makePropValueCell(timelineId, prop, prop)}
  </TR>
</TABLE>`;
    }
    else {
      attrs.push(`shape=record`); // this adds an outline to the table
      l = `
<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0">
  <TR>
    <TD BORDER="1" SIDES="R">${this.wrapText(label)}</TD>
    <TD ID="${timelineId}" TITLE="${timelineId}"><FONT COLOR="${Colors.value}">${value}</FONT></TD>
  </TR>
</TABLE>`;
    }
    attrs.push(this.makeLabelHtml(l));
    this.command(`${timelineId} ${this.makeAttrs(...attrs)}`);
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

  isDisconnectedSnapshot(node) {
    const { ddg } = this;
    return ddgQueries.isSnapshot(ddg, node) && !node.connected;
  }

  /**
   * Produce snapshot table with prop and value for each entry.
   * @param {DDGTimelineNode} node
   * @see https://graphviz.org/doc/info/shapes.html#html-like-label-examples
   */
  snapshotTable(node, colorOverride) {
    const { ddg, ddg: { timelineNodes } } = this;

    const { timelineId, label, parentNodeId, children } = node;
    const hasLabel = !parentNodeId && label !== undefined;
    const childEntries = Object.entries(children);
    if (this.isNodeRecordNode(node)) {
      // render empty snapshot as ref data node
      this.nodeRecord(node);
    }
    else {
      // render snapshot
      let attrs = this.nodeIdAttr(timelineId);
      if (colorOverride) {
        attrs += `,color=${colorOverride}`;
      }
      const childrenCells = childEntries
        .map(([prop, childId]) => {
          const child = timelineNodes[childId];
          prop = fixProp(prop);
          if (ddgQueries.isDeleteNode(this.ddg, child)) {
            return this.makeSnapshotDeleteCell(childId, prop);
          }
          return this.makePropValueCell(childId, prop);
        })
        .join('');
      this.command(`${timelineId} [${attrs},shape=plaintext,label=<
<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0">
  <TR>
    ${hasLabel ? `<TD ROWSPAN="2">${this.wrapText(label)}</TD>` : ''}
    ${childrenCells}
  </TR>
</TABLE>
>]`);
      // add child snapshots separately
      for (const [prop, childId] of childEntries) {
        const child = timelineNodes[childId];
        if (ddgQueries.isSnapshot(ddg, child)) {
          if (
            // not empty
            isEmpty(child.children) ||
            // connected
            !child.connected ||
            // has at least one child that is connected
            Object.values(child.children)
              .every(c => this.isDisconnectedSnapshot(timelineNodes[c]))
          ) {
            continue;
          }

          // add child snapshot
          this.snapshotTable(child);

          // add edge
          this.snapshotEdge(child);
        }
        // // NOTE: remove repeatedNode edges for performance reasons
        // else if (child.repeatedTimelineId) {
        //   const repeatedNode = timelineNodes[child.repeatedTimelineId];
        //   this.snapshotEdgeFromTo(this.makeNodeId(child), this.makeNodeId(repeatedNode));
        // }
      }

      // add snapshot root
      // this.addNodeToPullDownStructure(node);
    }
  }

  /**
   * Build a row of "column" cells containing tables.
   * We do this, so every node's column has a singular addressable PORT.
   */
  makePropValueCell(timelineId, prop, id = timelineId) {
    const { timelineNodes } = this.renderState;
    const node = timelineNodes[timelineId];
    // hide not-connected snapshot children
    const label = this.makeNodeValueString(node);
    return `<TD TITLE="${id}" ROWSPAN="2" PORT="${id}">
      <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0">
        <TR><TD BORDER="1" SIDES="B" COLOR="${Colors.snapshotSeparator}">\
<FONT COLOR="${Colors.snapshotProp}">${this.wrapText(prop)}</FONT></TD></TR>
        <TR><TD><FONT COLOR="${Colors.value}">${label}</FONT></TD></TR>
      </TABLE>
    </TD>`;
  }

  /**
   * Build a row of "column" cells containing tables.
   * We do this, so every node's column has a singular addressable PORT.
   */
  makeSnapshotDeleteCell(timelineId, prop) {
    // const { timelineNodes } = this.renderState;
    // const node = timelineNodes[timelineId];
    return `<TD ID="${timelineId}" TITLE="${timelineId}" ROWSPAN="2" PORT="${timelineId}">
      <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0">
        <TR><TD BORDER="1" COLOR="transparent">\
<FONT COLOR="${Colors.deleteValue}"><S>${prop}</S></FONT></TD></TR>
        <TR><TD><FONT COLOR="${Colors.deleteValue}">&nbsp;</FONT></TD></TR>
      </TABLE>
    </TD>`;
  }

  /** ###########################################################################
   * add a "pull-down" effect, using virtual (hidden) nodes
   * ##########################################################################*/

  pullNodes = [];

  addNodeToPullDownStructure(node) {
    if (!this.ddg.settings.extraVertical) {
      return;
    }
    if (!isControlGroupTimelineNode(node.type)) {
      this.pullNodes.push(node);
    }
  }

  /**
   * Idea: simply add invisible edges between all data-like nodes.
   * NOTE: Edges have a vertical "pull down" effect.
   */
  buildPullDownStructure() {
    if (!this.pullNodes.length) {
      return;
    }

    const vertices = this.pullNodes.map(n => n.timelineId);
    this.command(vertices.join(' -> ') + this.makeAttrs(invisAttr(), `weight=${RenderConfig.extraVerticalWeight}`));
    // this.command(vertices.join(' -> ') + ' [color=blue]');
  }

  // /**
  //  * Old idea:
  //  * s1 -> s2 -> s3;
  //  * 1 -> s1 -> 2 -> s2 -> 3 -> s3;
  //  * 
  //  * Idea2:
  //  * s1 -> s2 -> s3;
  //  * {rank=same; s1, 1};
  //  * {rank=same; s2, 2};
  //  * {rank=same; s3, 3};
  //  */
  // buildPullDownStructure() {
  //   if (!this.pullNodes.length) {
  //     return;
  //   }
  // // ignore in-snapshot nodes
  // this.pullNodes.push(node.timelineId);

  // // place pull node and rank command in same subgraph (else `rank=same` breaks subgraphs)
  // this.command(makePullId(node.timelineId) + invisAttrs());
  // this.command(`{rank=same; ${node.timelineId}, ${makePullId(node.timelineId)}}`);
  //   this.command(
  //     this.pullNodes
  //       .map(id => makePullId(id))
  //       .join(' -> ') + invisAttrs()
  //     // this.pullNodes
  //     //   .map(id => `{rank=same; ${id}, ${makePullId(id)}}`)
  //     // this.pullNodes
  //     //   .flatMap(id => [id, makePullId(id)])
  //     //   .join(' -> ')
  //   );
  // }
}

function invisAttr() {
  return 'style=invis';
}

function invisAttrs() {
  return '[style=invis]';
}

function makePullId(id) {
  return 's' + id;
}
