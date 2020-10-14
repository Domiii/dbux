import { window } from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';
import { initCodeDeco } from './codeDeco';

import { initCallGraphView } from './callGraphView/callGraphViewController';
import { initCommands } from './commands/index';
import { initToolBar } from './toolbar';
import { initPlayback } from './playback/index';

import { initCodeApplications } from './codeUtil/CodeApplication';
import { initTraceDetailsView } from './traceDetailsView/traceDetailsController';
import { initTraceSelection } from './codeUtil/codeSelection';
import { initApplicationsView } from './applicationsView/applicationsViewController';
import { getOrCreateProjectManager } from './projectViews/projectControl';
import { initProjectView } from './projectViews/projectViewsController';
import { initGraphView } from './webViews/graphWebView';
import { initPathwaysView } from './webViews/pathwaysWebView';
import { initWebviewWrapper } from './codeUtil/WebviewWrapper';
import { installDbuxDependencies, initInstallUtil } from './codeUtil/installUtil';
import { maybeStartSurvey1ForTheFirstTime } from './dialogs/dialogController';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-code');

/**
 * @param {import('vscode').ExtensionContext} context
 */
async function activate(context) {
  try {
    log(`Starting Dbux v${process.env.DBUX_VERSION} (mode=${process.env.NODE_ENV}, (dev only) DBUX_ROOT=${process.env.DBUX_ROOT})...`);

    // make sure, projectManager is available
    getOrCreateProjectManager(context);

    initInstallUtil(context);

    // install dependencies (and show progress bar) right away
    await installDbuxDependencies();

    // initRuntimeServer(context);
    initCodeApplications(context);
    initCodeDeco(context);
    initToolBar(context);
    initTraceSelection(context);
    initPlayback();

    initWebviewWrapper(context);

    initApplicationsView(context);
    const traceDetailsController = initTraceDetailsView(context);
    initProjectView(context);

    //  To bring these three views back, uncomment relevant lines and add this to `package.json` `contributes.views.dbuxViewContainer`:
    //  {
    //    "id": "dbuxEditorTracesView",
    //    "name": "Traces at Cursor"
    //  },
    // {
    //   "id": "dbuxCallGraphView",
    //   "name": "Call Graph Roots"
    // },
    // {
    //   "id": "dbuxCallStackView",
    //   "name": "Call Stack"
    // },

    const callGraphViewController = initCallGraphView(context);
    // const callStackViewController = initCallStackView();
    // initEditorTracesView(context);

    initCommands(
      context,
      traceDetailsController,
      callGraphViewController
    );

    // init the webviews
    initGraphView();
    initPathwaysView();

    await maybeStartSurvey1ForTheFirstTime();
  } catch (e) {
    logError('error in \'activate\'', e.stack);
    debugger;
  }
}

// this method is called when your extension is deactivated
function deactivate() {
}

export {
  activate,
  deactivate
};

global.window = window;