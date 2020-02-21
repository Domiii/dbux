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

  // ###########################################################################
  // tree building
  // ###########################################################################

  refresh = () => { //makeDebounce(() => {
    try {
      this.rootNodes = [];

      if (traceSelection.selected) {
        const trace = traceSelection.selected;
        // console.debug('refreshed trace', trace.traceId);
        const application = allApplications.getById(trace.applicationId);
        const traceNode = this.buildSelectedTraceNode(trace, application, null);
        this.rootNodes.push(traceNode);
      }
      else {
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

  buildSelectedTraceNode(trace, application, parent) {
    const node = this.createNode(SelectedTraceNode, trace, application, parent);
    node.collapsibleState = TreeItemCollapsibleState.Expanded;
    node.children = this._buildTraceDetailNodes(trace, application, node);
    return node;
  }

  buildTraceNode(trace, application, parent) {
    const node = this.createNode(TraceNode, trace, application, parent);
    node.children = [];
    return node;
  }

  _buildTraceDetailNodes(trace, application, parent) {
    const nodes = [
      // navigation nodes
      ...this.buildNavigationNodes(trace, application, parent),

      // other detail nodes
      ...this.createDetailNodes(trace, application, parent)
    ].filter(node => !!node);

    return nodes;
  }

  // ###########################################################################
  // overriding TreeDataProvider
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

  createNode(NodeClass, entry, application, parent, treeItemProps = EmptyObject, label): BaseNode {
    label = label || NodeClass.makeLabel(entry, application, parent);
    const relativeIconPath = NodeClass.makeIconPath && NodeClass.makeIconPath(entry, application, parent);
    const iconPath = relativeIconPath && getThemeResourcePath(relativeIconPath) || null;
    const id = (++_lastNodeId) + '';
    const node = new NodeClass(this, label, iconPath, application, parent, id, treeItemProps);
    node.init(entry);

    node.children = node.makeChildren?.();
    node.collapsibleState = node.children?.length ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.None;

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

  buildNavigationNodes(trace, application, parent): NavigationTDNode[] {
    return NavigationNodeClasses.map(NodeClass => {
      return this.buildNavigationNode(NodeClass, trace, application, parent);
    });
  }

  buildNavigationNode(NodeClass, trace, traceApplication, parent): NavigationTDNode {
    const { controlName } = NodeClass;
    const targetTrace = NodeClass.getTargetTrace(controlName);
    let targetTraceApplication;
    let label;
    if (targetTrace) {
      targetTraceApplication = allApplications.getById(targetTrace.applicationId);
      const arrow = NodeClass.makeArrow(trace, targetTrace, targetTraceApplication, parent);
      label = `${arrow} ${TraceNode.makeLabel(targetTrace, targetTraceApplication, parent)}`;
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
    const node = new NodeClass(this, label, iconPath, targetTraceApplication || traceApplication, parent, id, treeItemProps);
    node.init();
    this._onNewNode(node);
    return node;
  }
}


let _lastNodeId = 0;
