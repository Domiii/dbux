import { TreeItemCollapsibleState } from 'vscode';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import makeTreeItem, { makeTreeItems } from '../../helpers/makeTreeItem';
import { renderDDGNode, renderDDGNodesItem, renderDDGSummaries } from '../../treeViewsShared/ddgTreeViewUtil';
import { getActiveDDGWebview } from '../../webViews/ddgWebView';
import TraceDetailNode from './TraceDetailNode';
import { renderDataNode } from '../../treeViewsShared/dataTreeViewUtil';
import ddgQueries from '@dbux/data/src/ddg/ddgQueries';
import EmptyArray from '@dbux/common/src/util/EmptyArray';


/** ###########################################################################
 * {@link DDGTDNode}
 * ##########################################################################*/

export default class DDGTDNode extends TraceDetailNode {
  static makeLabel() {
    return 'DDG';
  }

  get ddgWebview() {
    return getActiveDDGWebview();
  }

  get ddg() {
    return this.ddgWebview?.ddg;
  }

  // makeIconPath() {
  //   return '';
  // }

  // eslint-disable-next-line camelcase
  renderTimelineNodes = (dataNode, predicate) => {
    const { ddg } = this;
    let ignoreSkipNode;
    const ignoreAndSkippedBy = ddg.timelineBuilder?.getIgnoreAndSkipInfo(dataNode);
    if (ignoreAndSkippedBy) {
      const { ignore, skippedBy } = ignoreAndSkippedBy;
      if (ignore) {
        ignoreSkipNode = makeTreeItem('(this node is ignored)');
      }
      if (skippedBy) {
        const children = skippedBy;
        ignoreSkipNode = renderDDGNode(
          ddg,
          skippedBy,
          children,
          EmptyObject,
          `n${dataNode.nodeId} Skipped By: `
        );
      }
    }
    let timelineNodesOfDataNode = ddg.getTimelineNodesOfDataNode(dataNode.nodeId);
    if (timelineNodesOfDataNode && predicate) {
      timelineNodesOfDataNode = timelineNodesOfDataNode.filter(predicate);
    }
    if (!timelineNodesOfDataNode?.length) {
      return ignoreSkipNode || EmptyArray;
    }

    // if (timelineNodes.length === 1) {
    //   return renderDDGNode(
    //     ddg, timelineNodes[0], timelineNodes[0],
    //     { collapsibleState: TreeItemCollapsibleState.Expanded }
    //   );
    // }

    const res = timelineNodesOfDataNode.map(
      timelineNode => renderDDGNode(ddg, timelineNode)
    );
    if (ignoreSkipNode) {
      res.unshift(ignoreSkipNode);
    }
    return res;
  }

  // eslint-disable-next-line camelcase
  Visible_TimelineNodes() {
    const { ddg, dataNodes } = this;
    const visibleTimelineNodes = dataNodes?.flatMap(dataNode => {
      return this.renderTimelineNodes(dataNode, node => ddgQueries.isVisible(ddg, node));
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
    const { ddg, dataNodes } = this;
    const summaryTimelineNodes = dataNodes?.flatMap(dataNode => {
      return ddg.timelineNodes.filter(n => n && n.dataNodeId === dataNode.nodeId && !n.og);
    });
    let summaryNodes = Array.from(
      new Set([
        // // own summaries
        // ...timelineNodes?.flatMap(n => ddg.nodeSummaries[n.timelineId]),

        // sumamry nodes that represent this node
        ...(summaryTimelineNodes || EmptyArray)
      ])
    ).filter(Boolean);

    if (!summaryNodes.length) {
      return makeTreeItem('(no summaries)');
    }

    return renderDDGNodesItem(ddg, summaryNodes, 'Summaries');
  }

  // eslint-disable-next-line camelcase
  All_TimelineNodes() {
    const { ddg, dataNodes } = this;
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
    const { ddg, dataNodes } = this;
    if (!dataNodes?.length) {
      return makeTreeItem('(no DataNodes)');
    }

    return {
      children: () => dataNodes.flatMap(dataNode => {
        return renderDataNode(ddg.dp, dataNode.nodeId);
      }),
      props: {
        collapsibleState: TreeItemCollapsibleState.Expanded,
        description: `(${dataNodes?.length || 0})`
      }
    };
  }

  async buildChildren() {
    if (!this.ddg) {
      return [
        makeTreeItem('(no DDG active)')
      ];
    }
    if (this.ddg.dp !== this.dp) {
      // → dp comes from selectedTrace, while ddg is the active webview
      return [
        makeTreeItem('(this DDG is not the active DDG)')
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
