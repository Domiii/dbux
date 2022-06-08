import { TreeItemCollapsibleState } from 'vscode';
import sleep from '@dbux/common/src/util/sleep';
import makeTreeItem from '../../helpers/makeTreeItem';
import { renderDataNode, renderDDGNode } from '../../treeViewsShared/ddgTreeViewUtil';
import { getActiveDDGWebview } from '../../webViews/ddgWebView';
import TraceDetailNode from './TraceDetailNode';
import traceSelection from '@dbux/data/src/traceSelection';
import EmptyObject from '@dbux/common/src/util/EmptyObject';


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
  TimelineNode = () => {
    const { dp, dataNodes, ddg } = this;

    const dataNode = traceSelection.nodeId ?
      dp.util.getDataNode(traceSelection.nodeId) :
      dp.util.getOwnDataNodeOfTrace(this.traceId);
    if (!dataNode) {
      return makeTreeItem('(no TimelineNode)');
    }

    // TODO: also render edges

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

    // TODO: also get control group by decision etc.

    const timelineNode = ddg.getTimelineNodeOfDataNode(dataNode.nodeId);
    return renderDDGNode(ddg, timelineNode);
  }

  DataNodes = () => {
    const { ddg, dataNodes } = this;
    if (!dataNodes?.length) {
      return makeTreeItem('(no DataNodes)');
    }
    return makeTreeItem(
      'DataNodes',
      () => dataNodes.map(n => {
        return renderDataNode(ddg, n);
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
      return [
        makeTreeItem('(no DDG active)')
      ];
      await sleep(0);
      setTimeout(() => this.treeNodeProvider.refresh());
      await sleep(50);
    }

    return [
      this.TimelineNode,
      this.DataNodes
    ];
  }

  handleClick() {
    this.treeNodeProvider.refresh();
  }
}
