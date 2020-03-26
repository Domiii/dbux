import { window, commands } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import { newLogger } from 'dbux-common/src/log/logger';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import { CallGraphNodeProvider } from './CallGraphNodeProvider';
import CallRootNode from './CallRootNode';

const { log, debug, warn, error: logError } = newLogger('CallGraphViewController');

export class CallGraphViewController {
  constructor(viewId, options) {
    this.callGraphNodeProvider = new CallGraphNodeProvider(this);
    this.callGraphView = window.createTreeView(viewId, { 
      treeDataProvider: this.callGraphNodeProvider,
      ...options
    });
    this.filterString = '';

    allApplications.selection.onApplicationsChanged((apps) => {
      this.refresh();
      for (const app of apps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('executionContexts', this.refresh)
        );
      }
    });
  }

  // ###########################################################################
  // Public methods
  // ###########################################################################

  refresh = makeDebounce(() => {
    this.callGraphNodeProvider.refresh();
  }, 100)
  
  /**
   * @param {CallRootNode} node
   */
  handleItemClick = (node) => {
    const dp = allApplications.getApplication(node.applicationId).dataProvider;
    const trace = dp.collections.traces.getById(node.traceId);
    if (trace) {
      traceSelection.selectTrace(trace);
    }
  }

  setFilter = () => {
    window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'keyword to filter e.g. \'[cb]\'',
      value: this.filterString
    }).then((filterString) => {
      if (filterString !== undefined) {
        this.filterString = filterString;
        this.refresh();
        commands.executeCommand('setContext', 'dbuxCallGraphView.context.filtering', true);
      }
    });
  }

  clearFilter = () => {
    this.filterString = '';
    this.refresh();
    commands.executeCommand('setContext', 'dbuxCallGraphView.context.filtering', false);
  }
}

let callGraphViewController: CallGraphViewController;

export function initCallGraphView() {
  commands.executeCommand('setContext', 'dbuxCallGraphView.context.filtering', false);
  callGraphViewController = new CallGraphViewController('dbuxCallGraphView', {
    canSelectMany: false,
    showCollapseAll: true
  });

  return callGraphViewController;
}