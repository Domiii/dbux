import { window, ExtensionContext } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import { registerCommand } from '../commands/commandUtil';
import EditorTracesDataProvider from './EditorTracesDataProvider';

const { log, debug, warn, error: logError } = newLogger('editorTracesController');

let controller;

class EditorTracesController {
  constructor() {
    this.treeDataProvider = new EditorTracesDataProvider();
    this.treeView = this.treeDataProvider.treeView;
  }

  refreshOnData = makeDebounce(() => {
    controller.treeDataProvider.refresh();
    if (this.applicationsChanged) {
      this.applicationsChanged = false;
      const firstNode = controller.treeDataProvider.rootNodes?.[0];
      controller.treeView.reveal(firstNode, { focus: true });
    }
  }, 20);


  initEventListeners(context) {
    // ########################################
    // hook up event handlers
    // ########################################

    // data changed
    allApplications.selection.onApplicationsChanged((selectedApps) => {
      this.applicationsChanged = true;
      for (const app of selectedApps) {
        allApplications.selection.subscribe(
          app.dataProvider.onData('traces', this.refreshOnData)
        );
      }
    });

    // traceSelection changed
    traceSelection.onTraceSelectionChanged(selectedTrace => {
      controller.treeDataProvider.refresh();
    });

    // cursor moved in text editor
    context.subscriptions.push(
      window.onDidChangeTextEditorSelection(() => {
        controller.treeDataProvider.refresh();
      })
    );
  }
}

// ###########################################################################
// init
// ###########################################################################


export function initTraceDetailsCommands(context) {
  registerCommand(context,
    'dbuxEditorTracesView.itemClick',
    (treeDetailsDataProvider, node) => treeDetailsDataProvider.handleClick(node)
  );
}

export function getTraceDetailsController() {
  return controller;
}

export function initEditorTracesController(context: ExtensionContext) {
  initTraceDetailsCommands(context);

  controller = new EditorTracesController();
  controller.initEventListeners(context);

  // refresh right away
  controller.treeDataProvider.refresh();
}