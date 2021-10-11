import { Uri, window } from 'vscode';

import open from 'open';
import { existsSync } from 'fs';
import isNaN from 'lodash/isNaN';
// import { stringify as jsonStringify } from 'comment-json';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { importApplication, exportApplication } from '@dbux/data/src/applications/appUtil';
import { newLogger } from '@dbux/common/src/log/logger';
import { checkSystem } from '@dbux/projects/src/checkSystem';
import { registerCommand } from './commandUtil';
import { showTextDocument } from '../codeUtil/codeNav';
import { getSelectedApplicationInActiveEditorWithUserFeedback } from '../codeUtil/codeExport';
import { showGraphView, hideGraphView } from '../webViews/graphWebView';
import { showPathwaysView, hidePathwaysView } from '../webViews/pathwaysWebView';
import { setShowDeco } from '../codeDeco';
import { toggleNavButton } from '../toolbar';
import { toggleErrorLog } from '../logging';
import { runFile } from './runCommands';
import { getProjectManager } from '../projectViews/projectControl';
import { showHelp } from '../help';
// import { installDbuxDependencies } from '../codeUtil/installUtil';
import { showOutputChannel } from '../projectViews/projectViewsController';
import { renderValueAsJsonInEditor } from '../traceDetailsView/valueRender';
import { getAllMemento, clearAll } from '../memento';
import { confirm, showErrorMessage, showInformationMessage } from '../codeUtil/codeModals';
import { translate } from '../lang';
import { getCodeDirectory, getDefaultExportDirectory, getLogsDirectory } from '../codeUtil/codePath';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('userCommands');


export function initUserCommands(extensionContext) {
  // ###########################################################################
  // exportApplicationData
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.exportApplicationData', async () => {
    const application = await getSelectedApplicationInActiveEditorWithUserFeedback();

    let exportFpath = application.getDefaultApplicationExportPath();
    if (await confirm('Zip?', true, true)) {
      exportFpath += '.zip';
    }
    if (existsSync(exportFpath)) {
      if (!await confirm(`File already exists: "${exportFpath}" - Overwrite?`, true, true)) {
        return;
      }
    }
    application && await exportApplication(application, exportFpath);

    const msg = translate('savedSuccessfully', { fileName: exportFpath });
    await showInformationMessage(msg, {
      Open: async () => {
        await showTextDocument(exportFpath);
      }
    });
  });

  registerCommand(extensionContext, 'dbux.importApplicationData', async () => {
    const options = {
      title: 'Select a file to read',
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'json or zip': ['json', 'zip']
      },
      defaultUri: Uri.file(getDefaultExportDirectory())
    };
    const file = (await window.showOpenDialog(options))?.[0];
    if (file) {
      allApplications.selection.clear();
      await importApplication(file.fsPath);
    }
  });

  // ###########################################################################
  // show/hide graph view
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showGraphView', async () => {
    await showGraphView(extensionContext);
  });

  registerCommand(extensionContext, 'dbux.hideGraphView', async () => {
    hideGraphView();
  });

  // ###########################################################################
  // show/hide pathways view
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showPathwaysView', async () => {
    await showPathwaysView();
  });

  registerCommand(extensionContext, 'dbux.hidePathwaysView', async () => {
    hidePathwaysView();
  });

  // ###########################################################################
  // show/hide code decorations
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showDecorations', () => {
    setShowDeco(true);
  });

  registerCommand(extensionContext, 'dbux.hideDecorations', () => {
    setShowDeco(false);
  });

  // ###########################################################################
  // show/hide nav buttons
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.toggleNavButton',
    toggleNavButton
  );

  // ###########################################################################
  // show/hide error log
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.toggleErrorLog',
    toggleErrorLog
  );

  // ###########################################################################
  // show/hide error log
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.openPracticeLogFolder', () => {
    open(getLogsDirectory());
  });

  // ###########################################################################
  // select trace
  // ###########################################################################

  async function openSelectTraceUI() {
    // input application
    const application = await getSelectedApplicationInActiveEditorWithUserFeedback();
    if (!application) {
      return;
    }
    const { applicationId } = application;

    // input traceId
    // TOTRANSLATE
    let userInput = await window.showInputBox({ placeHolder: 'please input a traceId' });
    if (!userInput) {
      // user canceled selection
      return;
    }

    const dp = allApplications.getById(applicationId).dataProvider;

    let traceId;
    if (userInput.startsWith('c')) {
      // get context
      const contextId = parseInt(userInput.substring(1), 10);
      traceId = dp.util.getFirstTraceOfContext(contextId)?.traceId;
      if (!traceId) {
        await showErrorMessage(`Invalid contextId: ${userInput.substring(1)}`);
        return;
      }
    }
    else if (userInput.startsWith('r')) {
      // get run
      const runId = parseInt(userInput.substring(1), 10);
      traceId = dp.util.getFirstTraceOfRun(runId);
    }
    else if (userInput.startsWith('n')) {
      // get node
      const nodeId = parseInt(userInput.substring(1), 10);
      traceId = dp.util.getDataNode(nodeId)?.traceId;
    }
    else if (userInput.startsWith('v')) {
      // get valueRef
      const refId = parseInt(userInput.substring(1), 10);
      traceId = dp.util.getFirstTraceByRefId(refId)?.traceId;
    }
    else {
      if (userInput.startsWith('t')) {
        userInput = userInput.substring(1);
      }
      traceId = parseInt(userInput, 10);
    }
    if (isNaN(traceId)) {
      // TOTRANSLATE
      await showErrorMessage(`Can't convert ${userInput} into integer`);
      return;
    }

    // select trace
    const trace = dp.collections.traces.getById(traceId);
    if (!trace) {
      // TOTRANSLATE
      await showErrorMessage(`Can't find trace of traceId ${traceId} & applicationId ${applicationId}`);
    }
    else {
      traceSelection.selectTrace(trace);
    }
  }

  registerCommand(extensionContext, 'dbux.selectTrace', openSelectTraceUI);


  // ###########################################################################
  // run + debug
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.runFile', () => runFile(extensionContext));
  registerCommand(extensionContext, 'dbux.debugFile', () => runFile(extensionContext, true));

  // ###########################################################################
  // practice backend
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.backendLogin', async () => {
    // if (process.env.NODE_ENV === 'production') {
    //   throw new Error('This command is currently disabled in Production mode.');
    // }
    const backend = await getProjectManager().getAndInitBackend();
    await backend.login();
    // await installDbuxDependencies();
    // const backend = await getOrCreateProjectManager().getAndInitBackend();
    const data = { installId: 'testIdqwe', hi: 123 };
    // log('storeSurveyResult', data);
    return backend.containers.survey1.storeSurveyResult(data);
  });

  registerCommand(extensionContext, 'dbux.deleteUserEvents', async () => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('This command is currently disabled in Production mode.');
    }
    await getProjectManager().deleteUserEvents();
  });

  // ###########################################################################
  // system check
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.systemCheck', async () => {
    let projectManager = getProjectManager(extensionContext);
    await checkSystem(projectManager, true, true);
  });

  // ###########################################################################
  // open help website
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showHelp', async () => {
    return showHelp();
  });

  // ###########################################################################
  // show outputChannel
  // ###########################################################################

  registerCommand(extensionContext, 'dbux.showOutputChannel', async () => {
    return showOutputChannel();
  });

  registerCommand(extensionContext, 'dbux.showMemento', async () => {
    return await renderValueAsJsonInEditor(getAllMemento());
  });

  registerCommand(extensionContext, 'dbux.clearMemento', async () => {
    await clearAll();
    // TOTRANSLATE
    await showInformationMessage('Memento cleared, please reload the window');
  });
}