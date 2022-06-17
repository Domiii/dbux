import { newLogger } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import sleep from '@dbux/common/src/util/sleep';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import searchController from '../search/searchController';
import ErrorTraceManager from './ErrorTraceManager';
import GlobalAnalysisNodeProvider from './GlobalAnalysisNodeProvider';
import GlobalDDGNode from './nodes/GlobalDDGNode';
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
    try {
      await this.treeDataProvider.showView();
      const searchResultNode = this.treeDataProvider.getRootByClass(GlobalSearchNode);
      await this.treeView.reveal(searchResultNode, { select: false, expand: 1 });
    }
    catch (err) {
      warn(new NestedError(`Failed to focus on search result`, err));
    }
  }

  /** ###########################################################################
   * error
   *  #########################################################################*/

  async showError() {
    this.errorTraceManager.showError();
    return await this.revealSelectedError();
  }

  async revealSelectedError() {
    if (!this.children) {
      await this.treeDataProvider.showView();
    }
    const errorNode = this.treeDataProvider.getRootByClass(GlobalErrorsNode);
    if (!errorNode.children) {
      this.treeDataProvider.buildChildren(errorNode);
    }
    const selectedErrorNode = errorNode.getSelectedChild();
    if (selectedErrorNode) {
      await this.treeView.reveal(selectedErrorNode);
      return selectedErrorNode;
    }
    return null;
    // else {
    //   logError(`Cannot find selected children after showError`);
    // }
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

  /** ###########################################################################
   * reveal
   * ##########################################################################*/

  async revealDDG(ddg) {
    try {
      const ddgsNode = this.treeDataProvider.getRootByClass(GlobalDDGNode);
      if (ddgsNode) {
        await this.treeView.reveal(ddgsNode, { expand: true });
        await sleep(100);

        const ddgNode = ddgsNode.children.find(n => n.ddg === ddg);
        if (ddgNode) {
          await this.treeView.reveal(ddgNode, { expand: true, select: true });
        }
      }
    }
    catch (err) {
      this.treeDataProvider.logger.warn(`revealDDG failed: ${err.stack || err}`);
    }
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

/**
 * @returns {GlobalAnalysisViewController}
 */
export function getGlobalAnalysisViewController() {
  if (!controller) {
    logError(`Cannot get GlobalAnalysisViewController before initialization.`);
  }
  return controller;
}
