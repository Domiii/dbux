import { ExtensionContext, commands } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import traceSelection from '@dbux/data/src/traceSelection';
import { throttle } from '@dbux/common/src/util/scheduling';
import allApplications from '@dbux/data/src/applications/allApplications';
import DataFlowNodeProvider from './DataFlowNodeProvider';
import DataFlowSearchModeType from './DataFlowSearchModeType';
import DataFlowFilterModeType from './DataFlowFilterModeType';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DataFlowViewController');

let controller;

export class DataFlowViewController {
  constructor() {
    this.treeDataProvider = new DataFlowNodeProvider(this);
    this.setSearchMode(DataFlowSearchModeType.ByValueId, false);
    this.setFilterMode(DataFlowFilterModeType.None, false);
    this.treeView.onDidChangeVisibility(async e => {
      if (e.visible) {
        await this.refresh();
      }
    });
  }

  get treeView() {
    return this.treeDataProvider.treeView;
  }

  setSearchMode(mode, refresh = true) {
    if (mode !== this.searchMode) {
      commands.executeCommand('setContext', 'dbuxDataFlowView.context.searchModeName', DataFlowSearchModeType.nameFromForce(mode));
      this.searchMode = mode;
      refresh && this.refresh();
    }
  }

  setFilterMode(mode, refresh = true) {
    if (mode !== this.filterMode) {
      commands.executeCommand('setContext', 'dbuxDataFlowView.context.filterModeName', DataFlowFilterModeType.nameFromForce(mode));
      this.filterMode = mode;
      refresh && this.refresh();
    }
  }

  focusOnSelectedNode = async () => {
    const selectedNode = this.treeDataProvider.rootNodes.find(root => root.isSelected?.());
    if (selectedNode) {
      await this.treeView.reveal(selectedNode, { select: false });
    }
  }

  refresh = async () => {
    if (!this.treeDataProvider.treeView.visible) {
      return;
    }
    // TODO: add a load indicator
    // NOTE: this can get very slow with 1k+ nodes (probably because of the way we compute labels?)
    await this.treeDataProvider.refresh();
  }

  refreshOnData = async () => {
    if (!this.treeDataProvider.treeView.visible) {
      return;
    }
    // TODO: add a load indicator
    // NOTE: this can get very slow with 1k+ nodes (probably because of the way we compute labels?)
    await this.treeDataProvider.refreshOnData();
  }

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
    traceSelection.onTraceSelectionChanged(async (/* selected */) => {
      await this.refresh();
      if (this.treeView.visible) {
        await this.focusOnSelectedNode();
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
export function initDataFlowView(context) {
  controller = new DataFlowViewController(context);
  controller.initOnActivate(context);

  // refresh right away
  controller.refresh();

  return controller;
}