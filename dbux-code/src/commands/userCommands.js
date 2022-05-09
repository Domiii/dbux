/* eslint-disable camelcase */
import { Uri, window } from 'vscode';
import path from 'path';

import open from 'open';
import { existsSync } from 'fs';
import isNaN from 'lodash/isNaN';
import sleep from '@dbux/common/src/util/sleep';
// import { stringify as jsonStringify } from 'comment-json';
import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import allApplications from '@dbux/data/src/applications/allApplications';
import { newLogger } from '@dbux/common/src/log/logger';
import { checkSystem, getDefaultRequirement } from '@dbux/projects/src/checkSystem';
import { importApplicationFromFile, exportApplicationToFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import { registerCommand } from './commandUtil';
import { getSelectedApplicationInActiveEditorWithUserFeedback } from '../applicationsView/applicationModals';
import { showGraphView, hideGraphView } from '../webViews/graphWebView';
import { showPathwaysView, hidePathwaysView } from '../webViews/pathwaysWebView';
import { setShowDeco } from '../codeDeco';
import { toggleNavButton } from '../toolbar';
import { toggleErrorLog } from '../logging';
import { getProjectManager } from '../projectViews/projectControl';
import { showHelp } from '../help';
// import { installDbuxDependencies } from '../codeUtil/installUtil';
import { showOutputChannel } from '../projectViews/projectViewsController';
import { chooseFile, confirm, showErrorMessage, showInformationMessage } from '../codeUtil/codeModals';
import { translate } from '../lang';
import { getDefaultExportDirectory, getLogsDirectory } from '../codeUtil/codePath';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import searchController from '../search/searchController';
import { emitSelectTraceAction, emitShowOutputChannelAction } from '../userEvents';
import { runFile } from './runCommands';

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

    await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
      progress.report({ message: 'exporting...' });
      await sleep();    // TODO: fix this in general -> reported message does not show up before next tick
      application && await exportApplicationToFile(application, exportFpath);
    });

    const msg = translate('savedSuccessfully', { fileName: exportFpath });
    await showInformationMessage(msg, {
      async 'Show File'() {
        await open(path.dirname(exportFpath));
      }
    });
  });

  registerCommand(extensionContext, 'dbux.importApplicationData', async () => {
    let defaultImportDir = getDefaultExportDirectory();

    const fileDialogOptions = {
      title: 'Select a file to read',
      folder: defaultImportDir,
      filters: {
        'json or zip': ['json', 'zip']
      },
    };
    const filePath = await chooseFile(fileDialogOptions);
    if (filePath) {
      allApplications.selection.clear();

      await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
        progress.report({ message: 'importing...' });
        await sleep(100);
        await importApplicationFromFile(filePath);
      });
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
      await showErrorMessage(`Can't find trace of traceId=${traceId} (applicationId=${applicationId})`);
    }
    else {
      traceSelection.selectTrace(trace);
      emitSelectTraceAction(trace, UserActionType.SelectTraceById, { userInput });
    }
  }

  registerCommand(extensionContext, 'dbux.selectTraceById', openSelectTraceUI);


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
    await checkSystem(projectManager, getDefaultRequirement(true), true);
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
    showOutputChannel();
    emitShowOutputChannelAction();
  });

  /** ###########################################################################
   * search
   *  #########################################################################*/

  registerCommand(extensionContext, 'dbux.searchContexts', async () => {
    return activateSearch(SearchMode.ByContext);
  });

  registerCommand(extensionContext, 'dbux.searchTraces', async () => {
    return activateSearch(SearchMode.ByTrace);
  });

  registerCommand(extensionContext, 'dbux.searchValues', async () => {
    return activateSearch(SearchMode.ByValue);
  });

  /** ###########################################################################
   * DDG
   *  #########################################################################*/

  registerCommand(extensionContext, 'dbux.showDDGOfContext', async () => {
    const trace = traceSelection.selected;
    if (trace) {
      const { applicationId, contextId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      dp.buildDDGForContext(contextId);
      // TODO-M: open webview
    }
    else {
      await showInformationMessage('No trace selected');
    }
  });
}

/** ###########################################################################
 * helpers
 *  #########################################################################*/

async function activateSearch(mode) {
  searchController.setSearchMode(mode);
  await showGraphView();
}