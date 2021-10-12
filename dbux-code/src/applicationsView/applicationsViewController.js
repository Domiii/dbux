import { commands } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeDebounce } from '@dbux/common/src/util/scheduling';
import ApplicationNodeProvider from './ApplicationNodeProvider';
import { onRuntimerServerStatusChanged } from '../net/SocketServer';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('applicationsViewController');

let controller;

class ApplicationsViewController {
  constructor() {
    this.treeNodeProvider = new ApplicationNodeProvider();
    this.treeView = this.treeNodeProvider.treeView;

    // keep the runtime server button updated
    commands.executeCommand('setContext', 'dbux.context.runtimeServerStarted', false);
    onRuntimerServerStatusChanged((status) => {
      commands.executeCommand('setContext', 'dbux.context.runtimeServerStarted', status);
    });
  }

  refreshOnData = () => {
    this.treeNodeProvider.refreshOnData();
  };
  initOnActivate(context) {
    // ########################################
    // hook up event handlers
    // ########################################

    // click event listener
    this.treeNodeProvider.initDefaultClickCommand(context);

    // data changed
    allApplications.selection.onApplicationsChanged((apps) => {
      this.refreshOnData();

      for (const app of apps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('staticProgramContexts', this.refreshOnData)
        );
      }
    });
    // allApplications.onAdded(this.refreshOnData);
    allApplications.onRemoved(this.refreshOnData);
    allApplications.onClear(this.refreshOnData);
    // allApplications.onRestarted(this.refreshOnData);
  }
}

// ###########################################################################
// init
// ###########################################################################


export function initApplicationsView(context) {
  controller = new ApplicationsViewController();
  controller.initOnActivate(context);

  // refresh right away
  controller.treeNodeProvider.refresh();
}