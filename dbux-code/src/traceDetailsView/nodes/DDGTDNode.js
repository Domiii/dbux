import { TreeItemCollapsibleState } from 'vscode';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import makeTreeItem, { makeTreeItems } from '../../helpers/makeTreeItem';
import { renderDDGNode } from '../../treeViewsShared/ddgTreeViewUtil';
import { getActiveDDGWebview } from '../../webViews/ddgWebView';
import TraceDetailNode from './TraceDetailNode';
import { renderDataNode } from '../../treeViewsShared/dataTreeViewUtil';


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
          'Skipped By: '
        );
      }
    }
    const timelineNodesOfDataNode = ddg.getTimelineNodesOfDataNode(dataNode.nodeId);
    if (!timelineNodesOfDataNode?.length) {
      return ignoreSkipNode || makeTreeItem(
        '(DataNode has no TimelineNode)'
      );
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

  TimelineNodes() {
    const { ddg, dataNodes } = this;
    const timelineNodes = dataNodes?.flatMap(dataNode => {
      // const children = {
      //   'Timeline Nodes': this.renderTimelineNodes(dataNode),
      //   ...dataNode
      // };
      // return renderDataNode(ddg.dp, dataNode.nodeId, children);
      return this.renderTimelineNodes(dataNode);
    });
    if (!timelineNodes?.length) {
      return makeTreeItem('(no TimelineNodes)');
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
      this.TimelineNodes.bind(this),
      this.DataNodes.bind(this)
    );
  }

  handleClick() {
    this.treeNodeProvider.refresh();
  }
}
