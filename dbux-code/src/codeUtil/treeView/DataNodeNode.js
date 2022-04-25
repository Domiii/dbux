import { TreeItemCollapsibleState } from 'vscode';
import Trace from '@dbux/common/src/types/Trace';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeTraceLabel, makeTraceLocLabel } from '@dbux/data/src/helpers/makeLabels';
import allApplications from '@dbux/data/src/applications/allApplications';
import BaseTreeViewNode from './BaseTreeViewNode';
import { getOuterMostTraceOfSameLine } from '../../helpers/codeRangeQueries';

/** @typedef { import("@dbux/common/src/types/DataNode").default } DataNode */

function makeDataNodeTypeSymbol(dataNode) {
  const type = DataNodeType.nameFrom(dataNode.type) || '?';
  return type.charAt(0);
}

/**
 * This is a TreeViewNode representing a `DataNode`
 */
export default class DataNodeNode extends BaseTreeViewNode {
  targetNodeId;
  
  /**
   * @param {DataNode} 
   */
  static makeLabel(dataNode) {
    const dp = allApplications.getById(dataNode.applicationId).dataProvider;
    let trace = dp.collections.traces.getById(dataNode.traceId);
    trace = getOuterMostTraceOfSameLine(trace);
    const traceLabel = makeTraceLabel(trace);
    // return `${typeSymbol} ${traceLabel}`;
    return traceLabel;
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

  /**
   * @return {string}
   */
  get typeSymbol() {
    return makeDataNodeTypeSymbol(this.dataNode);
  }

  isSelected() {
    return traceSelection.nodeId === this.dataNode.nodeId;
  }

  makeIconPath() {
    return this.isSelected() ? 'play.svg' : ' ';
  }

  init() {
    const typeSymbol = makeDataNodeTypeSymbol(this.dataNode);
    const loc = makeTraceLocLabel(this.trace);
    this.description = `[${typeSymbol}] ${loc}`;
  }

  handleClick() {
    const nodeId = this.targetNodeId || this.dataNode.nodeId;
    traceSelection.selectTrace(this.trace, 'DataNode', nodeId);
  }
}