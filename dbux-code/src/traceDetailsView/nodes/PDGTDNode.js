import { TreeItemCollapsibleState } from 'vscode';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import pdgQueries from '@dbux/data/src/pdg/pdgQueries';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import makeTreeItem, { makeTreeItems } from '../../helpers/makeTreeItem';
import { renderPDGNode, renderPDGNodesItem, renderPDGSummaries } from '../../treeViewsShared/pdgTreeViewUtil';
import { getActivePDGWebview } from '../../webViews/pdgWebView';
import TraceDetailNode from './TraceDetailNode';
import { renderDataNode } from '../../treeViewsShared/dataTreeViewUtil';
import { intersection } from 'lodash';

/** @typedef { import("@dbux/data/src/pdg/PDGTimelineNodes").PDGTimelineNode } PDGTimelineNode */


/** ###########################################################################
 * {@link PDGTDNode}
 * ##########################################################################*/

export default class PDGTDNode extends TraceDetailNode {
  static makeLabel() {
    return 'PDG';
  }

  get pdgWebview() {
    return getActivePDGWebview();
  }

  get pdg() {
    return this.pdgWebview?.pdg;
  }

  // makeIconPath() {
  //   return '';
  // }

  // eslint-disable-next-line camelcase
  renderTimelineNodes = (dataNode, predicate) => {
    const { pdg } = this;
    let ignoreSkipNode;
    const ignoreAndSkippedBy = pdg.timelineBuilder?.getIgnoreAndSkipInfo(dataNode);
    if (ignoreAndSkippedBy) {
      const { ignore, skippedBy } = ignoreAndSkippedBy;
      if (ignore) {
        ignoreSkipNode = makeTreeItem('(this node is ignored)');
      }
      if (skippedBy) {
        const children = skippedBy;
        ignoreSkipNode = renderPDGNode(
          pdg,
          skippedBy,
          children,
          EmptyObject,
          `n${dataNode.nodeId} Skipped By: `
        );
      }
    }
    let timelineNodesOfDataNode = pdg.getTimelineNodesOfDataNode(dataNode.nodeId);
    if (timelineNodesOfDataNode && predicate) {
      timelineNodesOfDataNode = timelineNodesOfDataNode.filter(predicate);
    }
    if (!timelineNodesOfDataNode?.length) {
      return ignoreSkipNode || EmptyArray;
    }

    // if (timelineNodes.length === 1) {
    //   return renderPDGNode(
    //     pdg, timelineNodes[0], timelineNodes[0],
    //     { collapsibleState: TreeItemCollapsibleState.Expanded }
    //   );
    // }

    const res = timelineNodesOfDataNode.map(
      timelineNode => renderPDGNode(pdg, timelineNode)
    );
    if (ignoreSkipNode) {
      res.unshift(ignoreSkipNode);
    }
    return res;
  }

  // eslint-disable-next-line camelcase
  Visible_TimelineNodes() {
    const { pdg, dataNodes } = this;
    const visibleTimelineNodes = dataNodes?.flatMap(dataNode => {
      return this.renderTimelineNodes(dataNode, node => pdgQueries.isVisible(pdg, node));
    });
    if (!visibleTimelineNodes?.length) {
      return makeTreeItem('(no visible TimelineNodes)');
    }
    return {
      children: visibleTimelineNodes,
      props: {
        collapsibleState: TreeItemCollapsibleState.Expanded,
        description: `(${visibleTimelineNodes?.length || 0})`
      }
    };
  }

  // eslint-disable-next-line camelcase
  Summaries() {
    const { pdg, dp, dataNodes } = this;

    // const tids = Array.from(new Set(
    //   dataNodes
    //     .flatMap(n => [n.varAccess?.declarationTid, n.traceId])
    //     .filter(Boolean)
    // ));
    // const refIds = Array.from(new Set(
    //   dataNodes
    //     .map(n => dp.util.getDataNodeAccessedRefId(n.nodeId))
    //     .filter(Boolean)
    // ));
    // TODO: this would pick up a lot of false positives

    /**
     * @type {PDGTimelineNode[]}
     */
    const timelineNodes = dataNodes
      .flatMap(n =>
        (pdg.getTimelineNodesOfDataNode(n.nodeId) || EmptyArray)
      );

    const allSummaries = Object.values(pdg.nodeSummaries);
    const nodeSummaries = timelineNodes
      // collapsed ancestor summaries
      .map(node => pdgQueries.getSummarizedGroupOfNode(pdg, node));

    // summaries which have any DataNode in their root
    const dataNodeSummaries = dataNodes.flatMap(n => allSummaries.filter(
      summary => summary.summaryRoots.some(rootNode => rootNode.dataNodeId === n.nodeId)
    ));
    let summaries = Array.from(new Set(
      nodeSummaries.concat(dataNodeSummaries).filter(Boolean)
    ));
    const description = !dataNodes.length ?
      '(no DataNodes)' :
      !timelineNodes.length ?
        '(no TimelineNodes)' :
        !timelineNodes.some(n => n.hasSummarizableWrites) ?
          '(not summarizable)' :
          !summaries.length ?
            '(not currently summarized)' :
            `(${summaries.length})`;

    return makeTreeItem(() => ({
      label: 'Summaries',
      children: () => renderPDGSummaries(pdg, summaries),
      props: {
        description
      }
    }));
  }

  // eslint-disable-next-line camelcase
  All_TimelineNodes() {
    const { pdg, dataNodes } = this;
    const timelineNodes = dataNodes?.flatMap(dataNode => {
      return this.renderTimelineNodes(dataNode);
    });
    if (!timelineNodes?.length) {
      return makeTreeItem('(no TimelineNodes at all)');
    }
    return {
      children: timelineNodes,
      props: {
        collapsibleState: TreeItemCollapsibleState.Expanded,
        description: `(${timelineNodes?.length || 0})`
      }
    };
  }

  DataNodes() {
    const { pdg, dataNodes } = this;
    if (!dataNodes?.length) {
      return makeTreeItem('(no DataNodes)');
    }

    return {
      children: () => dataNodes.flatMap(dataNode => {
        return renderDataNode(pdg.dp, dataNode.nodeId);
      }),
      props: {
        collapsibleState: TreeItemCollapsibleState.Expanded,
        description: `(${dataNodes?.length || 0})`
      }
    };
  }

  async buildChildren() {
    if (!this.pdg) {
      return [
        makeTreeItem('(no PDG active)')
      ];
    }
    if (this.pdg.dp !== this.dp) {
      // → dp comes from selectedTrace, while pdg is the active webview
      return [
        makeTreeItem('(this PDG is not the active PDG)')
      ];
    }

    return makeTreeItems(
      this.Visible_TimelineNodes.bind(this),
      this.Summaries.bind(this),
      this.All_TimelineNodes.bind(this),
      this.DataNodes.bind(this)
    );
  }

  handleClick() {
    this.treeNodeProvider.refresh();
  }
}
