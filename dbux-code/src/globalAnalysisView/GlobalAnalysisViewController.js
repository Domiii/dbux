import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import searchController from '../search/searchController';
import ErrorTraceManager from './ErrorTraceManager';
import GlobalAnalysisNodeProvider from './GlobalAnalysisNodeProvider';
import GlobalErrorsNode from './nodes/GlobalErrorsNode';
import GlobalSearchNode from './nodes/GlobalSearchNode';

/** @typedef {import('vscode').ExtensionContext} ExtensionContext */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('GlobalAnalysisViewController');

let controller;

export default class GlobalAnalysisViewController {
  constructor() {
    this.treeDataProvider = new GlobalAnalysisNodeProvider();
    this.treeDataProvider.controller = this;
    this.errorTraceManager = new ErrorTraceManager();
  }

  get treeView() {
    return this.treeDataProvider.treeView;
  }

  refresh = () => {
    this.treeDataProvider.decorateTitle(`(${allApplications.selection.getAll().length})`);
    return this.treeDataProvider.refresh();
  }

  refreshOnData = () => {
    this.errorTraceManager.refresh();

    this.refresh();
  }

  handleSearch = async (matches, searchTerm, fromUser) => {
    await this.refresh();

    if (matches?.length && searchTerm && fromUser) {
      await this.focusOnSearchResult();
    }
  }

  /** ###########################################################################
   * search
   *  #########################################################################*/

  async focusOnSearchResult() {
    const searchResultNode = this.treeDataProvider.getNodeByClass(GlobalSearchNode);
    await this.treeView.reveal(searchResultNode, { select: false, expand: 1 });
  }

  /** ###########################################################################
   * error
   *  #########################################################################*/

  async showError() {
    if (!this.children) {
      const errorNode = this.treeDataProvider.getNodeByClass(GlobalErrorsNode);
      await this.treeView.reveal(errorNode, { select: false, expand: true });
    }
    this.errorTraceManager.showError();
    const errorNode = this.treeDataProvider.getNodeByClass(GlobalErrorsNode);
    const selectedErrorNode = errorNode.getSelectedChild();
    if (selectedErrorNode) {
      await this.treeView.reveal(selectedErrorNode);
    }
    else {
      logError(`Cannot find selected children after showError`);
    }
  }

  /** ###########################################################################
   * init
   *  #########################################################################*/

  initOnActivate(context) {
    // click event listener
    this.treeDataProvider.initDefaultClickCommand(context);

    // application selection changed
    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.refreshOnData();
      for (const app of selectedApps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('traces', this.refreshOnData),
          // app.dataProvider.onData('staticProgramContexts', this.refreshOnData)
        );
      }
    });

    searchController.onSearch(this.handleSearch);
    traceSelection.onTraceSelectionChanged(() => this.treeDataProvider.refreshIcon());
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

export function getGlobalAnalysisViewController() {
  if (!controller) {
    logError(`Cannot get GlobalAnalysisViewController before initialization.`);
  }
  return controller;
}