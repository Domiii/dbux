import { TreeItemCollapsibleState } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import TraceValueNode from './TraceValueNode';
import { getRangeByTrace } from '../../codeUtil/codeRangeUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('NearbyValueTDNodes');

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */

/**
 * @deprecated `dp.util.getTraceValue` does not work now
 */
export default class NearbyValuesTDNode extends BaseTreeViewNode {
  static makeLabel(/* trace, parent, props */) {
    return 'Nearby Values';
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Collapsed;
  }

  init() {
    this.contextValue = 'dbuxTraceDetailsView.node.nearbyValuesTDNodeRoot';
  }

  buildChildren() {
    const { applicationId, contextId } = this.trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const traces = (dp.indexes.traces.byContext.get(contextId) || EmptyArray).filter((trace) => {
      const { traceId, staticTraceId } = trace;
      const type = dp.util.getTraceType(traceId);
      if (TraceType.is.CallExpressionResult(type)) {
        // ignore CallExpressionResults
        return false;
      }

      const label = dp.collections.staticTraces.getById(staticTraceId).displayName;
      const valueStr = dp.util.getTraceValueString(traceId);
      if (valueStr === label) {
        // ignore literals
        return false;
      }

      return true;
    });

    // find parents and their children
    const sortedTraces = traces.slice()
      .sort((a, b) => {
        const aStart = getRangeByTrace(a).start;
        const bStart = getRangeByTrace(b).start;
        if (aStart.isBefore(bStart)) {
          return -1;
        }
        if (aStart.isAfter(bStart)) {
          return 1;
        }
        return 0;
      });

    const parents = [];
    const indexByTraces = new Map();
    let currentOutMostTrace = null;
    let currentOutMostRange = null;
    let currentInner = [];
    for (const trace of sortedTraces) {
      const range = getRangeByTrace(trace);
      if (currentOutMostTrace === null) {
        currentOutMostTrace = trace;
        currentOutMostRange = range;
        continue;
      }

      if (range.intersection(currentOutMostRange)) {
        if (range.contains(currentOutMostRange)) {
          currentInner.push(currentOutMostTrace);
          currentOutMostTrace = trace;
          currentOutMostRange = range;
        }
        else {
          currentInner.push(trace);
        }
      }
      else {
        parents.push(currentOutMostTrace);
        currentInner.forEach((t) => indexByTraces.set(t, parents.length - 1));
        currentOutMostTrace = trace;
        currentOutMostRange = range;
        currentInner = [];
      }
    }

    // build tree with parents and indexByTraces
    let nodes = [];
    for (const parentTrace of parents) {
      const newNode = this.buildChildNode(parentTrace, this);
      nodes.push(newNode);
    }

    traces.forEach(childTrace => {
      if (indexByTraces.has(childTrace)) {
        const value = dp.util.getTraceValuePrimitive(childTrace.traceId);
        // ignore undefined
        if (value === undefined) {
          return;
        }

        const parentNode = nodes[indexByTraces.get(childTrace)];
        const childNode = this.buildChildNode(childTrace, parentNode);
        parentNode.children.push(childNode);

        if (traceSelection.isSelected(childTrace)) {
          this.delayExpandNode(parentNode);
        }
      }
    });

    nodes = nodes.filter((node) => {
      // filter out no-children parent with value undefined
      if (node.value === undefined && !node.children.length) {
        return false;
      }
      return true;
    });

    nodes.forEach((node) => {
      if (traceSelection.isSelected(node.trace)) {
        this.delayExpandNode(node);
      }
    });

    return nodes;
  }

  buildChildNode(trace, parent) {
    const label = TraceValueNode.makeLabel(trace);
    const node = new TraceValueNode(this.treeNodeProvider, label, trace, parent);
    node.children = [];
    return node;
  }

  delayExpandNode(node) {
    setTimeout(async () => {
      try {
        await this.treeNodeProvider.treeView.reveal(node, { expand: true, select: false });
      }
      catch (err) {
        logError('Can not reveal node', node, err);
      }
    });
  }
}