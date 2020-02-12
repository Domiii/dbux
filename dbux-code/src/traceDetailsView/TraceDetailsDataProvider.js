import { EventEmitter, TreeItemCollapsibleState } from "vscode";
import groupBy from 'lodash/groupBy';
import allApplications from 'dbux-data/src/applications/allApplications';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import { getTracesAt } from '../data/codeRangeQueries';
import { createNode, EmptyNode, TraceNode, tryCreateTraceDetailNode, SelectedTraceNode } from './nodes/TraceDetailsNode';
import { PreviousTraceTDNode, NextTraceTDNode, TypeTDNode, ValueTDNode, ApplicationTDNode } from './nodes/traceDetailNodes';
import { getCursorLocation } from '../codeNav';
import traceSelection from 'dbux-data/src/traceSelection';

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
    
    
    this.rootNodes = [];

    if (traceSelection.selected) {
      // show selected trace first
      const trace = traceSelection.selected;
      const application = allApplications.getById(trace.applicationId);
      const traceNode = this._buildTraceNode(trace, application, null, true);
      this.rootNodes.push(traceNode);
    }

    this.rootNodes.push(...allApplications.selection.data.mapApplicationsOfFilePath(
      fpath, (application, programId) => {
        const traceNodes = this._buildTraceNodes(programId, pos, application, null);
        return traceNodes || EmptyArray;
      }
    ));

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

    const traces = getTracesAt(application, programId, pos);
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
          // child.collapsibleState = TreeItemCollapsibleState.Collapsed;
          return child;
        });
      // node.children.unshift(...otherNodes);  // add before
      node.children.push(...otherNodes);    // add behind
      node.collapsibleState = TreeItemCollapsibleState.Expanded;

      return node;
    });
  }

  _buildTraceNode(trace, application, parent, isSelected = false) {
    const node = createNode(isSelected ? SelectedTraceNode : TraceNode, trace, application, parent);
    if (isSelected) {
      node.children = this._buildTraceDetailNodes(trace, application, node);
    }
    else {
      node.children = [];
    }
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