import { TreeItemCollapsibleState as CollapsibleState } from 'vscode';
import path from 'path';
import { isRealContextType } from 'dbux-common/src/core/constants/ExecutionContextType';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import { makeRootTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import allApplications from 'dbux-data/src/applications/allApplications';
import ContextNode from './ContextNode';

export default class CallRootNode {
  children: Array<ContextNode>;
  constructor(
    trace,
    callGraphNodeProvider
  ) {
    // node data
    this.addedContext = new Set();
    this.applicationId = trace.applicationId;
    this.runId = trace.runId;
    this.traceId = trace.traceId;
    this.callGraphNodeProvider = callGraphNodeProvider;

    // treeItem data
    this.label = makeRootTraceLabel(trace, allApplications.getById(trace.applicationId));
    this.parentNode = null;
    this.children = [];
    this.description = `App#${this.applicationId} Run#${this.runId}`;
    this.collapsibleState = CollapsibleState.None;
    this.command = {
      command: 'dbuxCallGraphView.itemClick',
      arguments: [this]
    };
    this.contextValue = 'callRootNode';

    // TODO: fix icon path
    this.iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };
  }

  updateChildren = () => {
    this._clearChildren();
    const dp = allApplications.getById(this.applicationId).dataProvider;
    const childContexts = dp.indexes.executionContexts.byRun.get(this.runId) || EmptyArray;
    for (let context of childContexts) {
      this._addChildren(this.applicationId, context);
    }
    this.children = this._getFilteredChildren();
    if (!this.children.length) {
      this.collapsibleState = CollapsibleState.None;
    }
    else if (this.collapsibleState === CollapsibleState.None) {
      this.collapsibleState = CollapsibleState.Collapsed;
    }
  }

  _getFilteredChildren = () => {
    const { filterString } = this.callGraphNodeProvider.callGraphViewController;
    return this.children.filter(x => x.label.includes(filterString));
  }

  /**
   * @param {ExecutionContext} context
   */
  _addChildren = (applicationId, context) => {
    if (this.addedContext.has(context.staticContextId)) {
      // already added
      return;
    }
    if (!isRealContextType(context.contextType)) {
      // do not show virtual context
      return;
    }
    this.addedContext.add(context.staticContextId);
    this.children.push(new ContextNode(applicationId, context, this));
  }

  _clearChildren = () => {
    this.children = [];
    this.addedContext = new Set();
    this.collapsibleState = CollapsibleState.None;
  }


  get tooltip() {
    return `${this.applicationId} ${this.runId} ${this.traceId} (tooltip)`;
  }
}

const EmptyNode = {
  label: '(no selected application)',
  collapsibleState: CollapsibleState.None
};

export { EmptyNode };