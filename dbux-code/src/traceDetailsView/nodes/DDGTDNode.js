import { TreeItemCollapsibleState } from 'vscode';
import sleep from '@dbux/common/src/util/sleep';
import traceSelection from '@dbux/data/src/traceSelection';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import makeTreeItem, { makeTreeItems } from '../../helpers/makeTreeItem';
import { renderDataNode, renderDDGNode } from '../../treeViewsShared/ddgTreeViewUtil';
import { getActiveDDGWebview } from '../../webViews/ddgWebView';
import TraceDetailNode from './TraceDetailNode';


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
  TimelineNodes = () => {
    const { dp, dataNodes, ddg } = this;

    const dataNode = traceSelection.nodeId ?
      dp.util.getDataNode(traceSelection.nodeId) :
      dp.util.getOwnDataNodeOfTrace(this.traceId);
    if (!dataNode) {
      return makeTreeItem('(no TimelineNode)');
    }

    const ignoreAndSkippedBy = ddg.timelineBuilder?.getIgnoreAndSkipInfo(dataNode);
    if (ignoreAndSkippedBy) {
      const { ignore, skippedBy } = ignoreAndSkippedBy;
      if (ignore) {
        return makeTreeItem('(this node is ignored)');
      }
      if (skippedBy) {
        const children = skippedBy;
        return renderDDGNode(
          ddg,
          skippedBy,
          children,
          EmptyObject,
          'Skipped By: '
        );
      }
    }

    // TODO: also render edges
    // TODO: also get control group by decision etc.

    const timelineNodes = ddg.getTimelineNodesOfDataNode(dataNode.nodeId);
    if (!timelineNodes?.length) {
      return makeTreeItem('(this DataNode has no TimelineNode)');
    }
    if (timelineNodes.length === 1) {
      return renderDDGNode(
        ddg, timelineNodes[0], timelineNodes[0],
        { collapsibleState: TreeItemCollapsibleState.Expanded }
      );
    }

    return makeTreeItem(
      'Timeline Nodes',
      timelineNodes.map(timelineNode => renderDDGNode(ddg, timelineNode)),
      {
        description: `${timelineNodes.length}`,
        collapsibleState: TreeItemCollapsibleState.Expanded
      }
    );
  }

  DataNodes = () => {
    const { ddg, dataNodes } = this;
    if (!dataNodes?.length) {
      return makeTreeItem('(no DataNodes)');
    }
    return makeTreeItem(
      'DataNodes',
      () => dataNodes.map(n => {
        return renderDataNode(ddg, n.nodeId);
      }),
      {
        collapsibleState: TreeItemCollapsibleState.Expanded,
        description: `(${dataNodes?.length || 0})`
      }
    );
  }

  async buildChildren() {
    if (!this.ddg) {
      return [
        makeTreeItem('(no DDG active)')
      ];
    }
    if (this.ddg.dp !== this.dp) {
      setTimeout(() => this.treeNodeProvider.refresh());
      return [
        makeTreeItem('(no DDG active)')
      ];
    }

    return makeTreeItems(
      this.TimelineNodes,
      this.DataNodes
    );
  }

  handleClick() {
    this.treeNodeProvider.refresh();
  }
}
