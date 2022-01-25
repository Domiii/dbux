import { TreeItemCollapsibleState } from 'vscode';
import Trace from '@dbux/common/src/types/Trace';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeTraceLabel, makeTraceLocLabel } from '@dbux/data/src/helpers/makeLabels';
import allApplications from '@dbux/data/src/applications/allApplications';
import BaseTreeViewNode from './BaseTreeViewNode';

/**
 * This is a TreeViewNode representing a `DataNode`
 */
export default class DataNodeNode extends BaseTreeViewNode {
  /**
   * @param {DataNode} 
   */
  static makeLabel(dataNode) {
    const dp = allApplications.getById(dataNode.applicationId).dataProvider;
    const trace = dp.collections.traces.getById(dataNode.traceId);
    return makeTraceLabel(trace);
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.None;
  }

  get dp() {
    const { applicationId } = this.entry;
    return allApplications.getById(applicationId).dataProvider;
  }

  /**
   * @type {Trace}
   */
  get trace() {
    return this.dp.collections.traces.getById(this.dataNode.traceId);
  }

  /**
   * @type {DataNode}
   */
  get dataNode() {
    return this.entry;
  }

  isSelected() {
    return traceSelection.nodeId === this.dataNode.nodeId;
  }

  makeIconPath() {
    return this.isSelected() ? 'play.svg' : ' ';
  }

  init() {
    const loc = makeTraceLocLabel(this.trace);
    this.description = loc;
  }

  handleClick() {
    traceSelection.selectTrace(this.trace, 'DataNode', this.dataNode.nodeId);
  }
}