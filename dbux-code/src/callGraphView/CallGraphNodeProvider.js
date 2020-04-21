import { TreeItemCollapsibleState as CollapsibleState } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import CallRootNode from './CallRootNode';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import EmptyNode from './EmptyNode';

const { log, debug, warn, error: logError } = newLogger('CallGraphNodeProvider');

export default class CallGraphNodeProvider extends BaseTreeViewNodeProvider {
  constructor(treeViewController) {
    super('dbuxCallGraphView', true);
    this.controller = treeViewController;
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
    const mode = this.controller.getMode();
    newRootNode.children = newRootNode.buildChildren(applicationId, runId, mode);

    // custom collapsibleState
    if (newRootNode.children.length) {
      if (this.controller.isFiltering()) {
        newRootNode.collapsibleStateOverride = CollapsibleState.Expanded;
      }
    }
    else {
      newRootNode.collapsibleStateOverride = CollapsibleState.None;
    }

    // newRootNode.collapsibleStateOverride = CollapsibleState.Expanded;

    return newRootNode;
  }
}