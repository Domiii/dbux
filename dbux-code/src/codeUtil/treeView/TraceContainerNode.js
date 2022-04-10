import { TreeItemCollapsibleState } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import { emitTDExecutionGroupModeChangedAction } from '../../userEvents';
import BaseTreeViewNode from './BaseTreeViewNode';
import TraceNode from './TraceNode';

/** @typedef {import('@dbux/data/src/RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */
/** @typedef {import('./TraceNode').default} TraceNode */

export class GroupNode extends BaseTreeViewNode {
  static labelPrefix = '';
  static labelSuffix = '';
  static TraceNodeClass = TraceNode;

  /**
   * @abstract
   * @param {RuntimeDataProvider} dp
   * @param {Trace} trace
   */
  // eslint-disable-next-line no-unused-vars
  static makeKey(dp, trace) {
    throw new Error('abstract method not implemented');
  }

  /**
   * @abstract
   * @param {BaseTreeViewNode} parent
   * @param {object} moreProp
   */
  // eslint-disable-next-line no-unused-vars
  static makeLabel(entry, parent, moreProp) {
    throw new Error('abstract method not implemented');
  }

  /**
   * @param {Array<Trace>} allTraces
   * @param {Array<Trace>} groupNodesData
   */
  // eslint-disable-next-line no-unused-vars
  static makeRootlabel(allTraces, groupNodesData) {
    if (this.labelSuffix) {
      return `${this.labelPrefix}: ${allTraces?.length || 0}x (${groupNodesData?.length || 0} groups ${this.labelSuffix})`;
    }
    else {
      return `${this.labelPrefix}: ${allTraces?.length || 0}x`;
    }
  }

  static group(dp, traces) {
    const byKey = new Map();
    for (const trace of traces) {
      const key = this.makeKey(dp, trace);
      if (!byKey.get(key)) byKey.set(key, []);
      byKey.get(key).push(trace);
    }

    return Array.from(byKey.entries());
  }

  static build(rootNode, [key, childTraces]) {
    const { treeNodeProvider, applicationId } = rootNode;
    return treeNodeProvider.buildNode(this, null, rootNode, { key, childTraces, applicationId });
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Expanded;
  }

  get dp() {
    return allApplications.getById(this.applicationId).dataProvider;
  }

  init() {
    this.description = this.makeDescription?.();
  }

  /**
   * @virtual
   */
  makeDescription() {
    return '';
  }

  handleClick() {
    const relevantTrace = this.getRelevantTrace();
    if (relevantTrace) {
      traceSelection.selectTrace(relevantTrace);
    }
  }

  /**
   * @virtual
   */
  // eslint-disable-next-line no-unused-vars
  getRelevantTrace() {
    return null;
  }

  buildChildren() {
    const { TraceNodeClass } = this.constructor;
    return this.childTraces.map(trace => {
      return this.treeNodeProvider.buildNode(TraceNodeClass, trace, this);
    });
  }
}

/**
 * Containing {@link TraceNode} as children and supports custom grouping.
 */
export default class TraceContainerNode extends BaseTreeViewNode {
  /** ###########################################################################
   * Group mode management
   *  #########################################################################*/
  static GroupClasses = [];
  static groupModeIndex = 0;

  static nextGroupMode() {
    this.groupModeIndex = (this.groupModeIndex + 1) % this.GroupClasses.length;
    emitTDExecutionGroupModeChangedAction(this.getCurrentGroupClass().labelSuffix);
  }

  static makeLabel(_entry, _parent, props) {
    return props.label;
  }

  // eslint-disable-next-line no-unused-vars
  static getAllTraces(entry) {
    throw new Error('abstract method not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  static makeProperties(entry, parent, props) {
    const allTraces = this.getAllTraces(entry);
    const applicationId = allTraces[0]?.applicationId;
    const dp = allApplications.getById(applicationId).dataProvider;

    const GroupNodeClazz = this.getCurrentGroupClass();
    const groupNodesData = GroupNodeClazz.group(dp, allTraces);
    const label = GroupNodeClazz.makeRootlabel(allTraces, groupNodesData);

    return {
      applicationId,
      groupNodesData,
      label
    };
  }

  static getCurrentGroupClass() {
    return this.GroupClasses[this.groupModeIndex];
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Collapsed;
  }

  init() {
    this.contextValue = 'dbux.node.TraceContainerNode';
  }

  buildChildren() {
    // use children built in `makeProperties`
    const { groupNodesData } = this;
    const GroupNodeClass = this.constructor.getCurrentGroupClass();
    return groupNodesData.map(groupNodeData => {
      return GroupNodeClass.build(this, groupNodeData);
    });
  }
}
