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
  renderTimelineNodes = (dataNode) => {
    const { dp, ddg } = this;

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

    const timelineNodesOfDataNode = ddg.getTimelineNodesOfDataNode(dataNode.nodeId);
    if (!timelineNodesOfDataNode?.length) {
      return makeTreeItem(
        '(DataNode has no TimelineNode)'
      );
    }

    // if (timelineNodes.length === 1) {
    //   return renderDDGNode(
    //     ddg, timelineNodes[0], timelineNodes[0],
    //     { collapsibleState: TreeItemCollapsibleState.Expanded }
    //   );
    // }

    return makeTreeItem(
      'Timeline Nodes',
      timelineNodesOfDataNode.map(timelineNode => renderDDGNode(ddg, timelineNode)),
      {
        description: `${timelineNodesOfDataNode.length}`,
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
      () => dataNodes.map(dataNode => {
        const children = {
          'Timeline Nodes': this.renderTimelineNodes(dataNode),
          ...dataNode
        };
        return renderDataNode(ddg, dataNode.nodeId, children);
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
      // → dp comes from selectedTrace, while ddg is the active webview
      return [
        makeTreeItem('(this DDG is not the active DDG)')
      ];
    }

    return makeTreeItems(
      // this.TimelineNodes,
      this.DataNodes
    );
  }

  handleClick() {
    this.treeNodeProvider.refresh();
  }
}
