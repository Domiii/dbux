import { ExtensionContext, commands } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeDebounce } from '@dbux/common/src/util/scheduling';
import allApplications from '@dbux/data/src/applications/allApplications';
import DataFlowNodeProvider from './DataFlowNodeProvider';
import DataFlowSearchModeType from './DataFlowSearchModeType';
import DataFlowFilterModeType from './DataFlowFilterModeType';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DataFlowViewController');

let controller;

export class DataFlowViewController {
  constructor() {
    this.searchMode = DataFlowSearchModeType.ByAccessId;
    this.filterMode = DataFlowFilterModeType.None;
    this.treeDataProvider = new DataFlowNodeProvider(this);

    commands.executeCommand('setContext', 'dbuxDataFlowView.context.filterModeName', DataFlowFilterModeType.nameFromForce(this.filterMode));
  }

  get treeView() {
    return this.treeDataProvider.treeView;
  }

  setSearchMode(mode) {
    if (mode !== this.searchMode) {
      this.searchMode = mode;
      this.refresh();
    }
  }

  setFilterMode(mode) {
    if (mode !== this.filterMode) {
      commands.executeCommand('setContext', 'dbuxDataFlowView.context.filterModeName', DataFlowFilterModeType.nameFromForce(mode));
      this.filterMode = mode;
      this.refresh();
    }
  }

  refresh = () => {
    this.treeDataProvider.refresh();
  }

  refreshOnData = makeDebounce(() => {
    this.refresh();
  }, 100);

  initOnActivate(context) {
    // ########################################
    // hook up event handlers
    // ########################################

    // click event listener
    this.treeDataProvider.initDefaultClickCommand(context);

    // data changed
    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.refreshOnData();
      for (const app of selectedApps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('traces', this.refreshOnData)
        );
      }
    });

    // add traceSelection event handler
    traceSelection.onTraceSelectionChanged((/* selected */) => {
      this.refresh();
    });
  }
}

// ###########################################################################
// init
// ###########################################################################

/**
 * @param {ExtensionContext} context 
 */
export function initDataFlowView(context) {
  controller = new DataFlowViewController(context);
  controller.initOnActivate(context);

  // refresh right away
  controller.refresh();

  return controller;
}