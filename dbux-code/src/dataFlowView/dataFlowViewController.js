import { ExtensionContext } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeDebounce } from '@dbux/common/src/util/scheduling';
import DataFlowNodeProvider from './DataFlowNodeProvider';
import allApplications from '@dbux/data/src/applications/allApplications';
import DataFlowViewModeType from './DataFlowViewModeType';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DataFlowViewController');

let controller;

export class DataFlowViewController {
  constructor(context) {
    this.mode = DataFlowViewModeType.ByAccessId;
    this.treeDataProvider = new DataFlowNodeProvider();
    this.treeDataProvider.controller = this;
  }

  get treeView() {
    return this.treeDataProvider.treeView;
  }

  setMode(mode) {
    if (mode !== this.mode) {
      this.mode = mode;
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