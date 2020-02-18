import { EventEmitter, TreeItemCollapsibleState } from "vscode";
import groupBy from 'lodash/groupBy';
import allApplications from 'dbux-data/src/applications/allApplications';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import EmptyObject from 'dbux-common/src/util/EmptyObject';
import traceSelection from 'dbux-data/src/traceSelection';
import { getTracesAt } from '../helpers/codeRangeQueries';
import { NavigationTDNode, NavigationNodeClasses, DetailNodeClasses } from './nodes/traceDetailNodes';
import { getCursorLocation } from '../codeNav';
import { getThemeResourcePath } from '../resources';
import TreeViewCommandWrapper from '../codeUtil/TreeViewCommandWrapper';
import SelectedTraceNode from './nodes/SelectedTraceNode';
import TraceNode from './nodes/TraceNode';
import BaseNode from './nodes/BaseNode';
import EmptyNode from './nodes/EmptyNode';

export default class TraceDetailsDataProvider {
  _onDidChangeTreeData = new EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;
  rootNodes;
  _lastId = 0;

  constructor() {
    this.commandWrapper = new TreeViewCommandWrapper(this);
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

  refresh = () => { //makeDebounce(() => {
    try {
      // console.warn('details refresh');
      this.where = getCursorLocation();

      this.rootNodes = [];

      if (traceSelection.selected) {
        // 1. selected trace
        const trace = traceSelection.selected;
        // console.debug('refreshed trace', trace.traceId);
        const application = allApplications.getById(trace.applicationId);
        const traceNode = this._buildTraceNode(trace, application, null, true);
        this.rootNodes.push(traceNode);
      }

      if (this.where) {
        // 2. all traces available at cursor in editor
        const {
          fpath,
          pos
        } = this.where;

        this.rootNodes.push(...allApplications.selection.data.mapApplicationsOfFilePath(
          fpath, (application, programId) => {
            const traceNodes = this._buildTraceNodes(programId, pos, application, null);
            return traceNodes || EmptyArray;
          }
        ));
      }

      if (!this.rootNodes.length) {
        // add empty node
        this.rootNodes.push(EmptyNode.instance);
      }

      // NOTE: if we only want to update subtree, pass root of subtree to `fire`
      this._onDidChangeTreeData.fire();

      this.commandWrapper.notifyRefresh();
    }
    catch (err) {
      console.error(err);
      debugger;
    }
    // }, 1)
  }

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
    const node = this.createNode(isSelected ? SelectedTraceNode : TraceNode, trace, application, parent);
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
      // navigation nodes
      ...this.createNavigationNodes(trace, application, parent),

      // other detail nodes
      ...this.createDetailNodes(trace, application, parent)
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

  // ###########################################################################
  // Base Node creation
  // ###########################################################################

  _onNewNode(node) {
    // node.command = {
    //   command: 'dbuxTraceDetailsView.itemClick',
    //   arguments: [this, node]
    // };
    this.commandWrapper.setCommand(node);
  }

  // _handleClick(node) {
  //   node._handleClick();
  // }

  createNode(
    NodeClass, entry, application, parent, treeItemProps = EmptyObject): BaseNode {
    const label = NodeClass.makeLabel(entry, application, parent);
    const relativeIconPath = NodeClass.makeIconPath && NodeClass.makeIconPath(entry, application, parent);
    const iconPath = relativeIconPath && getThemeResourcePath(relativeIconPath) || null;
    const id = (++_lastNodeId) + '';
    const node = new NodeClass(label, iconPath, application, parent, id, treeItemProps);
    node.init(entry);
    this._onNewNode(node);
    return node;
  }

  // ###########################################################################
  // Detail nodes
  // ###########################################################################

  createDetailNodes(trace, application, parent) {
    return DetailNodeClasses.map(NodeClass => this.tryCreateTraceDetailNode(NodeClass, trace, application, parent));
  }

  tryCreateTraceDetailNode(NodeClass, trace, application, parent) {
    const detail = NodeClass.makeTraceDetail(trace, application, parent);
    if (!detail) {
      return null;
    }
    const treeItemProps = {
      trace
    };
    return this.createNode(NodeClass, detail, application, parent, treeItemProps);
  }

  // ###########################################################################
  // Navigation nodes
  // ###########################################################################

  createNavigationNodes(trace, application, parent): NavigationTDNode[] {
    return NavigationNodeClasses.map(NodeClass => {
      return this.createNavigationNode(NodeClass, trace, application, parent);
    });
  }

  createNavigationNode(NodeClass, trace, application, parent): NavigationTDNode {
    const { controlName } = NodeClass;
    const targetTrace = NodeClass.getTargetTrace(controlName);
    let label;
    if (targetTrace) {
      const arrow = NodeClass.makeArrow(trace, targetTrace, application, parent);
      label = `${arrow} ${TraceNode.makeLabel(targetTrace, application, parent)}`;
    }
    else {
      label = ' ';
    }
    // const relativeIconPath = NodeClass.makeIconPath && NodeClass.makeIconPath(trace, application, parent);
    // const iconPath = relativeIconPath && getThemeResourcePath(relativeIconPath) || null;
    const iconPath = null;
    const id = (++_lastNodeId) + '';
    const treeItemProps = {
      trace,
      targetTrace
    };
    const node = new NodeClass(label, iconPath, application, parent, id, treeItemProps);
    node.init();
    this._onNewNode(node);
    return node;
  }
}


let _lastNodeId = 0;
