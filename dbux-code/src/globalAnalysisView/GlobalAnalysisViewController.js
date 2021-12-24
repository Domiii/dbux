import allApplications from '@dbux/data/src/applications/allApplications';
import GlobalAnalysisNodeProvider from './GlobalAnalysisNodeProvider';

/** @typedef {import('vscode').ExtensionContext} ExtensionContext */

let controller;

export default class GlobalAnalysisViewController {
  constructor() {
    this.treeDataProvider = new GlobalAnalysisNodeProvider();
    this.treeDataProvider.controller = this;
  }

  get treeView() {
    return this.treeDataProvider.treeView;
  }

  refresh = () => {
    return this.treeDataProvider.refresh(); // -> debounced
  }

  initOnActivate(context) {
    // click event listener
    this.treeDataProvider.initDefaultClickCommand(context);

    // application selection changed
    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.treeDataProvider.decorateTitle(`(${selectedApps.length} apps)`);
      this.refresh();

      for (const app of selectedApps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('traces', this.refresh)
        );
      }
    });
  }
}

// ###########################################################################
// init
// ###########################################################################

/**
 * @param {ExtensionContext} context 
 */
export function initGlobalAnalysisView(context) {
  controller = new GlobalAnalysisViewController(context);
  controller.initOnActivate(context);

  // refresh right away
  controller.refresh();

  return controller;
}