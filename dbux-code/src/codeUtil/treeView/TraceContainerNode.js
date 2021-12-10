import traceSelection from '@dbux/data/src/traceSelection';
import { TreeItemCollapsibleState } from 'vscode';
import BaseTreeViewNode from './BaseTreeViewNode';

/** @typedef {import('@dbux/data/src/RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */
/** @typedef {import('./TraceNode').default} TraceNode */

class GroupNode extends BaseTreeViewNode {
  static labelSuffix = '';

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
   * @param {string} key
   */
  // eslint-disable-next-line no-unused-vars
  static makeLabel(key) {
    throw new Error('abstract method not implemented');
  }

  /**
   * @param {Array<Trace>} executedTraces
   * @param {Array<Trace>} groupedTraces
   */
  // eslint-disable-next-line no-unused-vars
  static makeRootlabel(executedTraces, groupedTraces) {
    if (this.labelSuffix) {
      return `Executions: ${executedTraces?.length || 0}x (${groupedTraces?.length || 0} groups ${this.labelSuffix})`;
    }
    else {
      return `Executions: ${executedTraces?.length || 0}x`;
    }
  }

  static group(application, traces) {
    const byKey = new Map();
    for (const trace of traces) {
      const key = this.makeKey(application, trace);
      if (!byKey.get(key)) byKey.set(key, []);
      byKey.get(key).push(trace);
    }

    const groupedTraces = Array.from(byKey.entries())
      .map(([key, childTraces]) => {
        const label = this.makeLabel(application, key);
        const description = this.makeDescription(key);
        const relevantTrace = this.makeRelevantTrace?.(application, key);
        return { label, childTraces, description, relevantTrace };
      });

    return groupedTraces;
  }

  static buildNodes(rootNode, groupedTraces) {
    const { treeNodeProvider } = rootNode;
    return groupedTraces.map(({ label, childTraces, description, relevantTrace }) => {
      const groupNode = new this(treeNodeProvider, label, null, rootNode, { description, relevantTrace });
      groupNode.children = buildExecutionNodes(childTraces, groupNode);
      return groupNode;
    });
  }

  constructor(treeNodeProvider, label, entry, parent, moreProps) {
    moreProps = {
      ...moreProps,
      collapsibleState: TreeItemCollapsibleState.Expanded
    };
    super(treeNodeProvider, label, entry, parent, moreProps);
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Expanded;
  }

  handleClick() {
    if (this.relevantTrace) {
      traceSelection.selectTrace(this.relevantTrace);
    }
  }
}

/**
 * Containing {@link TraceNode} as children and supports custom grouping.
 * TODO: finish this
 */
export default class TraceContainerNode extends BaseTreeViewNode {
  groupClasses = [];

  /**
   * @virtual
   */
  static makeLabel(entry, parent) {
    throw new Error('abstract method not implemented');
  }

  init() {
    this.description = this.makeDescription?.();
  }
}
