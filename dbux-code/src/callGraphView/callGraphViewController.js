import { ExtensionContext, commands, window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeDebounce } from '@dbux/common/src/util/scheduling';
import CallGraphNodeProvider from './CallGraphNodeProvider';
import { emitTagTraceAction } from '../userEvents';
import UserActionType from '@dbux/data/src/pathways/UserActionType';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('callGraphViewController');

let controller;

export class CallGraphViewController {
  constructor() {
    this.treeDataProvider = new CallGraphNodeProvider(this);
    this.treeView = this.treeDataProvider.treeView;
    this._filterString = '';
    this._mode = 'context';
  }

  refresh = () => {
    this.treeDataProvider.refresh();
  }

  refreshOnData = makeDebounce(() => {
    this.refresh();
  }, 100);

  /**
   * @deprecated Moved to "TraceDetailsView"
   */
  refreshIcon = () => {
    // let hasError = false;
    // for (const app of allApplications.selection.getAll()) {
    //   if (app.dataProvider.util.getAllErrorTraces().length) {
    //     hasError = true;
    //     break;
    //   }
    // }
    // commands.executeCommand('setContext', 'dbuxCallGraphView.context.mode', this._mode);
    // commands.executeCommand('setContext', 'dbux.context.hasError', hasError);
  }

  initOnActivate(context) {
    commands.executeCommand('setContext', 'dbuxCallGraphView.context.filtering', false);
    commands.executeCommand('setContext', 'dbux.context.hasError', false);
    commands.executeCommand('setContext', 'dbuxCallGraphView.context.mode', 'context');

    // ########################################
    // hook up event handlers
    // ########################################

    // click event listener
    this.treeDataProvider.initDefaultClickCommand(context);

    // to refresh 'selected trace' icon
    traceSelection.onTraceSelectionChanged(this.refresh);

    // data changed
    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.refreshOnData();
      this.refreshIcon();
      for (const app of selectedApps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('executionContexts', this.refreshOnData),
          app.dataProvider.onData('traces', this.refreshIcon)
        );
      }
    });
  }

  // ###########################################################################
  //  Public
  // ###########################################################################

  selectError() {
    this.showError();
    this.refresh();

    for (const rootNode of this.treeDataProvider.rootNodes) {
      if (rootNode.children[0]) {
        // only select first error
        const { trace } = rootNode.children[0];
        emitTagTraceAction(trace, UserActionType.GoToError);
        traceSelection.selectTrace(trace);
        break;
      }
    }
  }

  // ########################################
  //  Mode functions (showContext/showError)
  // ########################################

  getMode() {
    return this._mode;
  }

  showContext() {
    this._setMode('context');
  }

  showError() {
    this._setMode('error');
  }

  // ########################################
  //  Filter functions
  // ########################################

  getFilterString() {
    return this._filterString;
  }

  isFiltering() {
    return !!this._filterString;
  }

  setFilter = () => {
    window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: 'keyword to filter e.g. \'[cb]\'',
      value: this._filterString
    }).then((filterString) => {
      if (filterString !== undefined) {
        this._setFilter(filterString);
      }
    });
  }

  clearFilter = () => {
    this._setFilter('');
  }

  // ###########################################################################
  //  Private
  // ###########################################################################

  _setMode(mode) {
    if (this._mode !== mode) {
      this._mode = mode;
      this.refreshIcon();
      this.clearFilter();
      this.refresh();
    }
  }

  _setFilter = (str) => {
    this._filterString = str;
    commands.executeCommand('setContext', 'dbuxCallGraphView.context.filtering', this.isFiltering());
    this.refresh();
    if (this.isFiltering()) {
      for (let node of this.treeDataProvider.rootNodes) {
        const expand = !!node.collapsibleState;
        this.treeView.reveal(node, { expand, select: false });
      }
    }
  }
}

// ###########################################################################
// init
// ###########################################################################

// /**
//  * @param {ExtensionContext} context 
//  */
// export function initCallGraphView(context) {
//   controller = new CallGraphViewController();
//   controller.initOnActivate(context);

//   // refresh right away
//   controller.refresh();

//   return controller;
// }