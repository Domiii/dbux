import { EventEmitter, TreeItemCollapsibleState } from "vscode";
import groupBy from 'lodash/groupBy';
import allApplications from 'dbux-data/src/applications/allApplications';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import { getVisitedTracesAt } from '../data/codeRange';
import { createTraceDetailsNode, EmptyNode, TraceNode, tryCreateTraceDetailNode } from './nodes/TraceDetailsNode';
import { PreviousTraceTDNode, NextTraceTDNode, TypeTDNode, ValueTDNode, ApplicationTDNode } from './nodes/traceDetailNodes';
import { getCursorLocation } from '../codeNav';

export default class TraceDetailsDataProvider {
  _onDidChangeTreeData = new EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  rootNodes;
  _lastId = 0;

  constructor() {
  }

  /**
   * 
   * @param {*} where.fpath
   * @param {*} where.pos
   */
  setEditorSelection(where) {
    this.where = where;

    this.refresh();
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  refresh = makeDebounce(() => {
    this.where = getCursorLocation();
    const {
      fpath,
      pos
    } = this.where;

    // TODO: incorporate `traceSelection` here

    const rootNodes = this.rootNodes = allApplications.selection.data.mapApplicationsOfFilePath(
      fpath, (application, programId) => {
        const traceNodes = this._buildTraceNodes(programId, pos, application, null);
        return traceNodes || EmptyArray;
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

    // TODO: let `codeTraceSelection` decide which trace(s) to show

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
      // node.children.unshift(...otherNodes);  // add before
      node.children.push(...otherNodes);    // add behind

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
      tryCreateTraceDetailNode(ApplicationTDNode, trace, application, parent),
      tryCreateTraceDetailNode(PreviousTraceTDNode, trace, application, parent),
      tryCreateTraceDetailNode(NextTraceTDNode, trace, application, parent),
      tryCreateTraceDetailNode(TypeTDNode, trace, application, parent),
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