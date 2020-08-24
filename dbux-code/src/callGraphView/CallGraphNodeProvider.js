import { TreeItemCollapsibleState as CollapsibleState } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import CallRootNode from './CallRootNode';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import EmptyNode from './EmptyNode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('CallGraphNodeProvider');

export default class CallGraphNodeProvider extends BaseTreeViewNodeProvider {
  constructor(treeViewController) {
    super('dbuxCallGraphView', { showCollapseAll: true, createTreeView: false });
    this.treeViewController = treeViewController;
  }

  buildRoots() {
    const allFirstTraces = allApplications.selection.data.firstTracesInOrder.getAll();
    const allRootNode = allFirstTraces.map(trace => this.buildRootNode(trace));


    if (!allRootNode.length) {
      allRootNode.push(EmptyNode.instance);
    }

    return allRootNode.reverse();
  }

  buildRootNode = (trace) => {
    const newRootNode = this.buildNode(CallRootNode, trace);
    const { applicationId, runId } = trace;
    const mode = this.treeViewController.getMode();
    newRootNode.children = newRootNode.buildChildren(applicationId, runId, mode);

    // custom collapsibleState
    if (newRootNode.children.length) {
      if (this.treeViewController.isFiltering()) {
        newRootNode.collapsibleStateOverride = CollapsibleState.Expanded;
      }
      else if (this.treeViewController.getMode() === 'error') {
        newRootNode.collapsibleStateOverride = CollapsibleState.Expanded;
      }
    }
    else {
      newRootNode.collapsibleStateOverride = CollapsibleState.None;
    }

    // newRootNode.collapsibleStateOverride = CollapsibleState.Expanded;

    return newRootNode;
  }

  getFirstError() {
    const allFirstTraces = allApplications.selection.data.firstTracesInOrder.getAll();
    for (const trace of allFirstTraces) {
      const { applicationId, runId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      const errors = dp.indexes.traces.errorByRun.get(runId) || EmptyArray;
      if (errors.length) return errors[0];
    }
    return null;
  }
}