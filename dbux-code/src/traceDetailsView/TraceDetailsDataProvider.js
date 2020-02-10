import { EventEmitter, Position, TreeItemCollapsibleState } from "vscode";
import applicationCollection from 'dbux-data/src/applicationCollection';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import groupBy from 'lodash/groupBy';
import { codeLineToBabelLine } from '../helpers/locHelper';
import { getVisitedTracesAt } from '../data/codeRange';
import { ApplicationNode, createTraceDetailsNode, EmptyNode, TraceNode, tryCreateTraceDetailNode } from './nodes/TraceDetailsNode';
import { PreviousContextTraceTDNode, NextContextTraceTDNode, TypeTDNode, ValueTDNode } from './nodes/traceDetailNodes';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';

export default class TraceDetailsDataProvider {
  _onDidChangeTreeData = new EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  rootNodes;
  _lastId = 0;

  constructor() {
  }

  /**
   * @param {Position} pos 
   */
  setSelected(where) {
    this.where = where;

    this.refresh();
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  refresh = makeDebounce(() => {
    const {
      fpath,
      pos
    } = this.where;

    // add nodes for Applications, iff we have more than one
    const addApplicationNodes = applicationCollection.selection.data.getApplicationCountAtPath(fpath) > 1;

    const rootNodes = this.rootNodes = applicationCollection.selection.data.mapApplicationsOfFilePath(fpath,
      (application, programId) => {
        let applicationNode;
        if (addApplicationNodes) {
          // add application node
          applicationNode = createTraceDetailsNode(ApplicationNode, application, application, null);
        }
        else {
          // don't add application node
          applicationNode = null;
        }

        const traceNodes = this._buildTraceNodes(programId, pos, application, applicationNode);
        return applicationNode || traceNodes || EmptyArray;
      }
    );

    // TODO: sort by time executed

    if (!this.rootNodes.length) {
      // add empty node
      this.rootNodes.push(EmptyNode.instance);
    }

    this._onDidChangeTreeData.fire();
  }, 1)

  _buildTraceNodes(programId, pos, application, parent) {
    // const { staticTraceId } = staticTrace;
    // const traces = application.dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);

    const traces = getVisitedTracesAt(application, programId, pos);
    if (!traces?.length) {
      return null;
    }

    // group by context, then sort by `contextId` (most recent first)
    const traceGroups = Object.values(
      groupBy(traces, 'contextId')
    )
      .sort((a, b) => b[0].contextId - a[0].contextId);

    return traceGroups.map(traceGroup => {
      // start with inner-most (oldest) trace
      const trace = traceGroup[0];
      const node = this._buildTraceNode(trace, application, parent);

      // add other traces as children (before details)
      const otherTraces = traceGroup.slice(1);
      const otherNodes = otherTraces
        .map(other => {
          const child = this._buildTraceNode(other, application, node);
          child.collapsibleState = TreeItemCollapsibleState.Collapsed;
          return child;
        });
      node.children.unshift(...otherNodes);

      return node;
    });
  }

  _buildTraceNode(trace, application, parent) {
    const node = createTraceDetailsNode(TraceNode, trace, application, parent);
    node.children = this._buildTraceDetailNodes(trace, application, node);
    return node;
  }

  _buildTraceDetailNodes(trace, application, parent) {
    const nodes = [
      tryCreateTraceDetailNode(TypeTDNode, trace, application, parent),
      tryCreateTraceDetailNode(PreviousContextTraceTDNode, trace, application, parent),
      tryCreateTraceDetailNode(NextContextTraceTDNode, trace, application, parent),
      tryCreateTraceDetailNode(ValueTDNode, trace, application, parent),
    ].filter(node => !!node);

    return nodes;
  }

  // ###########################################################################
  // misc bookkeeping
  // ###########################################################################

  clear() {
    this.refresh();
  }

  getTreeItem = (node) => {
    return node;
  }

  getChildren = (node) => {
    if (node) {
      return node.children;
    }
    else {
      return this.rootNodes;
    }
  }

  getParent = (node) => {
    return node.parent;
  }
}