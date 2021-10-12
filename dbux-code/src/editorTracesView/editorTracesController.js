import { window, ExtensionContext } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeDebounce } from '@dbux/common/src/util/scheduling';
import { registerCommand } from '../commands/commandUtil';
import EditorTracesNodeProvider from './EditorTracesNodeProvider';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('editorTracesController');

let controller;

/**
 * TreeView to investigate and understand all traces at cursor.
 * Currently unused.
 */
class EditorTracesController {
  constructor() {
    this.treeDataProvider = new EditorTracesNodeProvider();
    this.treeView = this.treeDataProvider.treeView;
  }

  refreshOnData = makeDebounce(() => {
    controller.treeDataProvider.refresh();
    // if (this.applicationsChanged) {
    //   // also select node + open view (if not already opened)
    //   this.applicationsChanged = false;
    //   const firstNode = controller.treeDataProvider.rootNodes?.[0];
    //   firstNode && controller.treeView.reveal(firstNode, { focus: true });
    // }
  }, 20);


  initOnActivate(context) {
    // ########################################
    // hook up event handlers
    // ########################################
    
    // click event listener
    this.treeDataProvider.initDefaultClickCommand(context);

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
    traceSelection.onTraceSelectionChanged(() => {
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

// /**
//  * @param {ExtensionContext} context 
//  */
// export function initEditorTracesView(context) {
//   controller = new EditorTracesController();
//   controller.initOnActivate(context);

//   // refresh right away
//   controller.treeDataProvider.refresh();
// }