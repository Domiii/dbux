import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import ApplicationNodeProvider from './ApplicationNodeProvider';

const { log, debug, warn, error: logError } = newLogger('applicationsViewController');

let controller;

class ApplicationsViewController {
  constructor() {
    this.treeDataProvider = new ApplicationNodeProvider();
    this.treeView = this.treeDataProvider.treeView;
  }

  refreshOnData = makeDebounce(() => {
    controller.treeDataProvider.refresh();
  }, 20);


  initOnActivate(context) {
    // ########################################
    // hook up event handlers
    // ########################################
    
    // click event listener
    this.treeDataProvider.initDefaultClickCommand(context);

    // data changed
    allApplications.onAdded(this.refreshOnData);
    allApplications.onRemoved(this.refreshOnData);
    allApplications.onClear(this.refreshOnData);
    allApplications.onRestarted(this.refreshOnData);

    // selection changed
    allApplications.selection.onApplicationsChanged(this.refreshOnData);
  }
}

// ###########################################################################
// init
// ###########################################################################


export function initApplicationsViewController(context) {
  controller = new ApplicationsViewController();
  controller.initOnActivate(context);

  // refresh right away
  controller.treeDataProvider.refresh();
}